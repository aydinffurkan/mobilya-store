'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bulkInsertProducts } from '@/app/admin/urunler/actions'
import { Plus, Trash2, Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react'

function turkishSlugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface Row {
  id: string
  name: string
  slug: string
  category_id: string
  price: string
  sale_price: string
  stock: string
  is_active: boolean
  _slugEdited: boolean
}

const emptyRow = (): Row => ({
  id: crypto.randomUUID(),
  name: '',
  slug: '',
  category_id: '',
  price: '',
  sale_price: '',
  stock: '0',
  is_active: true,
  _slugEdited: false,
})

interface SaveResult {
  name: string
  status: 'success' | 'error'
  message?: string
  id?: string
}

interface Props {
  categories: Category[]
}

export default function BulkProductForm({ categories }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: 5 }, emptyRow))
  const [saving, setSaving] = useState(false)
  const [results, setResults] = useState<SaveResult[] | null>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  const updateRow = (id: string, field: keyof Row, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const next = { ...r, [field]: value }
        if (field === 'name' && !r._slugEdited) {
          next.slug = turkishSlugify(value as string)
        }
        if (field === 'slug') {
          next._slugEdited = (value as string).length > 0
        }
        return next
      })
    )
  }

  const addRows = (n: number) =>
    setRows((prev) => [...prev, ...Array.from({ length: n }, emptyRow)])

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id))

  const filledRows = rows.filter((r) => r.name.trim() && r.price.trim())

  const handleSave = async () => {
    if (filledRows.length === 0) {
      toast.error('Ad ve fiyat alanları dolu olan en az 1 satır gerekli.')
      return
    }

    setSaving(true)
    try {
      const payload = filledRows.map((r) => ({
        name: r.name.trim(),
        slug: r.slug.trim() || turkishSlugify(r.name.trim()),
        category_id: r.category_id || null,
        price: parseFloat(r.price),
        sale_price: r.sale_price ? parseFloat(r.sale_price) : null,
        stock: parseInt(r.stock) || 0,
        is_active: r.is_active,
      }))

      const { results: serverResults } = await bulkInsertProducts(payload)

      const resultList: SaveResult[] = payload.map((p, i) => ({
        name: p.name,
        status: serverResults[i].success ? 'success' : 'error',
        message: serverResults[i].message,
        id: serverResults[i].id,
      }))

      setResults(resultList)

      const successCount = resultList.filter((r) => r.status === 'success').length
      const errorCount = resultList.filter((r) => r.status === 'error').length

      if (successCount > 0) toast.success(`${successCount} ürün başarıyla eklendi`)
      if (errorCount > 0) toast.error(`${errorCount} ürün eklenemedi`)

      if (errorCount === 0) {
        setRows(Array.from({ length: 5 }, emptyRow))
      }
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        toast.error('CSV dosyası boş veya hatalı.')
        return
      }

      const dataLines = lines.slice(1)
      const newRows: Row[] = dataLines
        .map((line) => {
          const cols = line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ''))
          const [name = '', catName = '', price = '', salePrice = '', stock = '0'] = cols
          const cat = categories.find(
            (c) => c.name.toLowerCase() === catName.toLowerCase()
          )
          return {
            id: crypto.randomUUID(),
            name,
            slug: turkishSlugify(name),
            category_id: cat?.id ?? '',
            price,
            sale_price: salePrice,
            stock: stock || '0',
            is_active: true,
            _slugEdited: false,
          }
        })
        .filter((r) => r.name)

      if (newRows.length === 0) {
        toast.error('CSV içeriği okunamadı.')
        return
      }

      setRows((prev) => {
        const empties = prev.filter((r) => !r.name.trim())
        const filled = prev.filter((r) => r.name.trim())
        return empties.length > 0 ? [...filled, ...newRows] : [...prev, ...newRows]
      })
      toast.success(`${newRows.length} satır içe aktarıldı`)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => addRows(1)}>
          <Plus size={14} className="mr-1" /> Satır Ekle
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addRows(10)}>
          +10 Satır
        </Button>
        <button
          type="button"
          onClick={() => csvRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-sm px-3 h-8 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Upload size={14} /> CSV'den İçe Aktar
        </button>
        <input ref={csvRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvImport} />
        <span className="text-xs text-muted-foreground ml-auto">
          {filledRows.length} / {rows.length} satır hazır
        </span>
      </div>

      {/* CSV hint */}
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        CSV formatı (ilk satır başlık):{' '}
        <span className="font-mono">Ad, Kategori, Fiyat, İndirimli Fiyat, Stok</span>
        {' '}— Görseller, varyantlar ve detaylar eklendikten sonra her üründe ayrı düzenlenir.
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-8">#</th>
              <th className="text-left font-medium text-muted-foreground px-2 py-2.5 min-w-[200px]">
                Ad <span className="text-red-400">*</span>
              </th>
              <th className="text-left font-medium text-muted-foreground px-2 py-2.5 min-w-[160px]">Slug</th>
              <th className="text-left font-medium text-muted-foreground px-2 py-2.5 min-w-[150px]">Kategori</th>
              <th className="text-left font-medium text-muted-foreground px-2 py-2.5 min-w-[110px]">
                Fiyat <span className="text-red-400">*</span>
              </th>
              <th className="text-left font-medium text-muted-foreground px-2 py-2.5 min-w-[110px]">İndirimli</th>
              <th className="text-left font-medium text-muted-foreground px-2 py-2.5 w-[90px]">Stok</th>
              <th className="text-center font-medium text-muted-foreground px-2 py-2.5 w-16">Aktif</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-3 py-2 text-muted-foreground text-xs">{index + 1}</td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                    placeholder="Ürün adı"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.slug}
                    onChange={(e) => updateRow(row.id, 'slug', e.target.value)}
                    placeholder="otomatik"
                    className="h-8 text-xs font-mono"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={row.category_id}
                    onChange={(e) => updateRow(row.id, 'category_id', e.target.value)}
                    className="w-full h-8 border border-border rounded-md px-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
                  >
                    <option value="">— Seçin —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={row.price}
                    onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={row.sale_price}
                    onChange={(e) => updateRow(row.id, 'sale_price', e.target.value)}
                    placeholder="—"
                    min="0"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={row.stock}
                    onChange={(e) => updateRow(row.id, 'stock', e.target.value)}
                    min="0"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => updateRow(row.id, 'is_active', e.target.checked)}
                    className="accent-[#222222] w-4 h-4"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save + cancel */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || filledRows.length === 0}
          className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Kaydediliyor…
            </>
          ) : (
            `${filledRows.length} Ürünü Kaydet`
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/urunler')}>
          İptal
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="border border-border rounded-2xl p-5 space-y-3 bg-white">
          <h3 className="font-semibold text-sm">Kayıt Sonuçları</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                  r.status === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {r.status === 'success' ? (
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={14} className="flex-shrink-0" />
                )}
                <span className="font-medium">{r.name}</span>
                {r.message && (
                  <span className="text-xs opacity-75 ml-1">— {r.message}</span>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/urunler')}
            className="text-sm text-[#222222] hover:underline"
          >
            Ürün listesine git →
          </button>
        </div>
      )}
    </div>
  )
}

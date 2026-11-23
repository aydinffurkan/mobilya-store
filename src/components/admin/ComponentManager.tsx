'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveComponent, deleteComponent, applyComponentTemplate, createProductFromComponent } from '@/app/admin/urunler/actions'
import { ProductComponent, ComponentTemplate } from '@/types'
import { Plus, Pencil, Trash2, Loader2, Wand2, ImagePlus, X as XIcon, PackagePlus, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getComponentImages } from '@/lib/componentImages'

interface Props {
  productId: string
  /** Ana ürün galerisi — parça görselleri buradan seçilir */
  productImages?: string[]
  components: ProductComponent[]
  templates?: ComponentTemplate[]
  categories?: { id: string; name: string }[]
}

interface FormState {
  name: string
  unit_price: string
  cost_price: string
  profit_pct: string
  included_by_default: boolean
  min_quantity: string
  max_quantity: string
  stock: string
  sort_order: string
  is_active: boolean
  images: string[]
  dim_width: string
  dim_depth: string
  dim_height: string
}

const emptyForm = (sortOrder: number): FormState => ({
  name: '',
  unit_price: '0',
  cost_price: '',
  profit_pct: '',
  included_by_default: true,
  min_quantity: '0',
  max_quantity: '1',
  stock: '0',
  sort_order: String(sortOrder),
  is_active: true,
  images: [],
  dim_width: '',
  dim_depth: '',
  dim_height: '',
})

const toFormState = (c: ProductComponent): FormState => ({
  name: c.name,
  unit_price: String(c.unit_price),
  cost_price: c.cost_price != null ? String(c.cost_price) : '',
  profit_pct: (c.cost_price && c.cost_price > 0) ? String(Math.round(((c.unit_price / c.cost_price) - 1) * 100)) : '',
  included_by_default: c.default_quantity > 0,
  min_quantity: String(c.min_quantity),
  max_quantity: String(c.max_quantity),
  stock: String(c.stock),
  sort_order: String(c.sort_order),
  is_active: c.is_active,
  images: getComponentImages(c),
  dim_width: c.dim_width ?? '',
  dim_depth: c.dim_depth ?? '',
  dim_height: c.dim_height ?? '',
})

const computeUnitPrice = (cost: string, pct: string): string | null => {
  const c = Number(cost); const p = Number(pct)
  if (cost !== '' && pct !== '' && !Number.isNaN(c) && !Number.isNaN(p) && c > 0 && p >= 0) {
    return String(Math.round(c * (1 + p / 100)))
  }
  return null
}

export default function ComponentManager({ productId, productImages = [], components, templates = [], categories = [] }: Props) {
  const router = useRouter()
  const [spawnId, setSpawnId] = useState<string | null>(null)
  const [spawnCat, setSpawnCat] = useState('')
  const [spawning, setSpawning] = useState(false)

  const handleSpawn = async (componentId: string) => {
    if (!spawnCat) { toast.error('Kategori seçiniz'); return }
    setSpawning(true)
    try {
      const res = await createProductFromComponent(componentId, spawnCat)
      toast.success(`"${res.name}" ayrı ürün olarak oluşturuldu. Ürünler bölümünden düzenleyebilirsiniz.`)
      setSpawnId(null); setSpawnCat('')
      router.refresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Oluşturulamadı') }
    finally { setSpawning(false) }
  }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pickerTemplateId, setPickerTemplateId] = useState('')
  const [applyingTemplate, setApplyingTemplate] = useState(false)

  const handleApplyTemplate = async () => {
    if (!pickerTemplateId) return
    const template = templates.find((t) => t.id === pickerTemplateId)
    if (!template) return
    if (!confirm(`"${template.name}" şablonundaki ${template.items.length} parça bu ürüne eklenecek. Devam edilsin mi?`)) return

    setApplyingTemplate(true)
    try {
      await applyComponentTemplate(productId, pickerTemplateId, components.length)
      toast.success('Şablon uygulandı, parçalar eklendi')
      setPickerTemplateId('')
      router.refresh()
    } catch (e: any) {
      toast.error('Şablon uygulanamadı: ' + e.message)
    } finally {
      setApplyingTemplate(false)
    }
  }

  const startAdd = () => {
    setEditingId(null)
    setAdding(true)
    setForm(emptyForm(components.length))
  }

  const startEdit = (component: ProductComponent) => {
    setAdding(false)
    setEditingId(component.id)
    setForm(toFormState(component))
  }

  const cancel = () => {
    setAdding(false)
    setEditingId(null)
    setForm(null)
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast.error('Parça adı gerekli')
      return
    }

    const minQty = Number(form.min_quantity) || 0
    const maxQty = Number(form.max_quantity) || 0
    const defaultQty = form.included_by_default ? 1 : 0
    if (maxQty < minQty) {
      toast.error('Maksimum adet, minimum adetten küçük olamaz')
      return
    }
    if (defaultQty < minQty || defaultQty > maxQty) {
      toast.error('"Varsayılan olarak dahil" işaretliyse parça en az 1 adet seçilebilmeli; min/maks aralığını kontrol edin')
      return
    }

    setSaving(true)
    try {
      await saveComponent(productId, editingId, {
        name: form.name.trim(),
        unit_price: Number(form.unit_price) || 0,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        default_quantity: defaultQty,
        min_quantity: minQty,
        max_quantity: maxQty,
        stock: Number(form.stock) || 0,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        images: form.images,
        dim_width: form.dim_width.trim() || null,
        dim_depth: form.dim_depth.trim() || null,
        dim_height: form.dim_height.trim() || null,
      })
      toast.success(editingId ? 'Parça güncellendi' : 'Parça eklendi')
      cancel()
      router.refresh()
    } catch (e: any) {
      toast.error('Kaydedilemedi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (componentId: string) => {
    if (!confirm('Bu parçayı silmek istediğinize emin misiniz?')) return
    setDeletingId(componentId)
    try {
      await deleteComponent(componentId)
      toast.success('Parça silindi')
      router.refresh()
    } catch (e: any) {
      toast.error('Silinemedi: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="lg:col-span-3 bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Ürün İçeriği (Parçalar)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Örn. &quot;Yatak Odası Takımı&quot; ürünü için &quot;Komodin&quot;, &quot;Şifonyer&quot; gibi parçalar. <strong>Buraya en az bir parça eklerseniz</strong>, ürün sayfasındaki fiyat artık ürünün kendi fiyatı değil, müşterinin seçtiği parçaların (birim fiyat × adet) toplamı olur — hiç parça eklemezseniz ürün fiyatı her zamanki gibi varsayılan kalır. Buradaki stok yalnızca takip amaçlıdır — ürün detayında gösterilen stok her zaman ürünün kendi stok değeridir.
          </p>
        </div>
        {!adding && !editingId && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Parça Ekle
          </Button>
        )}
      </div>

      {templates.length > 0 && !adding && !editingId && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border border-dashed border-[#222222]/40 bg-[#222222]/5">
          <Wand2 size={16} className="text-[#222222] flex-shrink-0" />
          <select
            value={pickerTemplateId}
            onChange={(e) => setPickerTemplateId(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-border bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
          >
            <option value="">Bir parça şablonu seçin...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.items.length} parça)
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleApplyTemplate}
            disabled={!pickerTemplateId || applyingTemplate}
            className="flex-shrink-0 border-[#222222] text-[#222222] hover:bg-[#222222] hover:text-white"
          >
            {applyingTemplate ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Uygula
          </Button>
        </div>
      )}

      {components.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-3">Henüz parça eklenmemiş. Bu alan, çok parçalı ürünler (yatak odası takımı vb.) için isteğe bağlıdır.</p>
      )}

      <div className="space-y-2">
        {components.map((component) => {
          const compImages = getComponentImages(component)
          return (
          <div key={component.id}>
            {editingId === component.id && form ? (
              <ComponentForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} productImages={productImages} />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {compImages.length > 0 ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative border border-border">
                      <Image src={compImages[0]} alt={component.name} fill className="object-cover" sizes="40px" />
                      {compImages.length > 1 && (
                        <span className="absolute bottom-0 right-0 bg-black/65 text-white text-[9px] leading-none px-1 py-0.5 rounded-tl">
                          +{compImages.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border border-border border-dashed">
                      <ImagePlus size={14} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{component.name}</span>
                      {!component.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pasif</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Birim fiyat: {component.unit_price.toLocaleString('tr-TR')} ₺
                      {' · '}{component.default_quantity > 0 ? 'Varsayılan: dahil (1 adet)' : 'Varsayılan: dahil değil (opsiyonel)'}
                      {' · '}Aralık: {component.min_quantity}-{component.max_quantity}
                      {' · '}Stok: {component.stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setSpawnId(spawnId === component.id ? null : component.id); setSpawnCat('') }
}
                    title="Ayrı ürün olarak ekle"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <PackagePlus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(component)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(component.id)}
                    disabled={deletingId === component.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === component.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
            {spawnId === component.id && (
              <div className="mt-1.5 flex items-center gap-2 border border-dashed border-border rounded-xl px-4 py-2.5 bg-secondary/20">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Ayrı ürün olarak ekle →</span>
                <select value={spawnCat} onChange={(e) => setSpawnCat(e.target.value)} className="flex-1 min-w-0 px-2 py-1.5 border border-border rounded-lg text-sm bg-background">
                  <option value="">Kategori seçin...</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button type="button" onClick={() => void handleSpawn(component.id)} disabled={spawning} className="px-3 py-1.5 bg-[#222222] text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                  {spawning ? <Loader2 size={13} className="animate-spin" /> : <PackagePlus size={13} />} Oluştur
                </button>
              </div>
            )}
          </div>
          )
        })}

        {adding && form && (
          <ComponentForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} productImages={productImages} />
        )}
      </div>
    </div>
  )
}

function ComponentForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  productImages,
}: {
  form: FormState
  setForm: (f: FormState) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  productImages: string[]
}) {
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const supabase = createClient()
      const urls: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `component-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data, error } = await supabase.storage.from('product-images').upload(path, file)
        if (error) throw error
        urls.push(supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl)
      }
      setForm({ ...form, images: [...form.images, ...urls.filter((u) => !form.images.includes(u))] })
    } catch (e: any) {
      toast.error('Görsel yüklenemedi: ' + e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Not: dosya depodan silinmez — aynı görsel ana galeride/başka parçada kullanılıyor olabilir.
  const removeImage = (url: string) => setForm({ ...form, images: form.images.filter((u) => u !== url) })

  const moveImage = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= form.images.length) return
    const next = [...form.images]
    ;[next[index], next[target]] = [next[target], next[index]]
    setForm({ ...form, images: next })
  }

  const togglePicked = (url: string) => {
    setForm({
      ...form,
      images: form.images.includes(url) ? form.images.filter((u) => u !== url) : [...form.images, url],
    })
  }

  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-3 bg-[#222222]/5">
      {/* Görseller */}
      <div className="space-y-2">
        <Label>Parça Görselleri</Label>

        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={url} className="w-24">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted">
                  <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-[#222222] text-white text-[9px] px-1.5 py-0.5 rounded">Kapak</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Görseli kaldır"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-destructive"
                  >
                    <XIcon size={11} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Öne al" className="h-6 w-6 rounded border border-border bg-white flex items-center justify-center disabled:opacity-30">
                    <ChevronLeft size={12} />
                  </button>
                  <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Sona al" className="h-6 w-6 rounded border border-border bg-white flex items-center justify-center disabled:opacity-30">
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            disabled={productImages.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 border border-border bg-white rounded-lg text-xs hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <ImagePlus size={14} className="text-muted-foreground" />
            {productImages.length === 0 ? 'Ürün galerisi boş' : pickerOpen ? 'Seçimi Kapat' : 'Ürün Görsellerinden Seç'}
          </button>
          <label className={`inline-flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} className="text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{uploading ? 'Yükleniyor...' : 'Yeni Görsel Yükle'}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>

        {pickerOpen && productImages.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-3">
            <p className="text-xs text-muted-foreground mb-2">Birden fazla görsel işaretleyebilirsiniz. Aynı görsel birden fazla parçada kullanılabilir.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {productImages.map((url) => {
                const picked = form.images.includes(url)
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => togglePicked(url)}
                    aria-pressed={picked}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${picked ? 'border-[#222222]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 30vw, 120px" />
                    {picked && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#222222] text-white flex items-center justify-center">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Parça Adı *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="örn. Komodin"
        />
      </div>

      {/* Alış fiyatı + kâr % → birim fiyatı otomatik hesaplar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Alış Fiyatı (₺)</Label>
          <Input type="number" min={0} placeholder="Opsiyonel" value={form.cost_price}
            onChange={(e) => { const up = computeUnitPrice(e.target.value, form.profit_pct); setForm({ ...form, cost_price: e.target.value, ...(up != null ? { unit_price: up } : {}) }) }} />
        </div>
        <div className="space-y-1.5">
          <Label>Kâr %</Label>
          <Input type="number" min={0} placeholder="örn. 40" value={form.profit_pct}
            onChange={(e) => { const up = computeUnitPrice(form.cost_price, e.target.value); setForm({ ...form, profit_pct: e.target.value, ...(up != null ? { unit_price: up } : {}) }) }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Birim Fiyat (₺) *</Label>
          <Input type="number" min={0} value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Stok</Label>
          <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Min. Adet *</Label>
          <Input type="number" min={0} value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Maks. Adet *</Label>
          <Input type="number" min={0} value={form.max_quantity} onChange={(e) => setForm({ ...form, max_quantity: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Sıra</Label>
          <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Ölçüler</Label>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.dim_width} onChange={(e) => setForm({ ...form, dim_width: e.target.value })} placeholder="Genişlik (160 cm)" />
          <Input value={form.dim_depth} onChange={(e) => setForm({ ...form, dim_depth: e.target.value })} placeholder="Derinlik (200 cm)" />
          <Input value={form.dim_height} onChange={(e) => setForm({ ...form, dim_height: e.target.value })} placeholder="Yükseklik (28 cm)" />
        </div>
        <p className="text-xs text-muted-foreground">
          Ürün Boyutları tablosunda &quot;Parçalardan Doldur&quot; ile çekilir; parçadan ayrı ürün oluşturunca yeni ürüne otomatik yazılır.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Müşteri bu parçanın adedini Min-Maks aralığında değiştirebilir. Ürün fiyatı, seçili tüm parçaların (birim fiyat × adet) toplamı olarak hesaplanır.
      </p>

      <div className="space-y-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.included_by_default}
            onChange={(e) => setForm({ ...form, included_by_default: e.target.checked })}
            className="accent-[#222222] w-4 h-4"
          />
          <span className="text-sm font-medium">Varsayılan olarak dahil (1 adet ile gelsin)</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="accent-[#222222] w-4 h-4"
          />
          <span className="text-sm font-medium">Aktif (sitede görünsün)</span>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving || uploading} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
      </div>
    </div>
  )
}

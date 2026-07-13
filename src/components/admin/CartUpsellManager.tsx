'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search, X, Loader2, Plus } from 'lucide-react'
import { saveCartUpsell, searchProductsForUpsell, ProductSlim } from '@/app/admin/ayarlar/actions'

interface Props {
  initial: ProductSlim[]
}

export default function CartUpsellManager({ initial }: Props) {
  const [selected, setSelected]   = useState<ProductSlim[]>(initial)
  const [query,    setQuery]      = useState('')
  const [results,  setResults]    = useState<ProductSlim[]>([])
  const [saving,   setSaving]     = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSearch = (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    startTransition(async () => {
      const data = await searchProductsForUpsell(q)
      setResults(data.filter((p) => !selected.some((s) => s.id === p.id)))
    })
  }

  const add = (p: ProductSlim) => {
    if (selected.some((s) => s.id === p.id)) return
    setSelected((prev) => [...prev, p])
    setResults((prev) => prev.filter((r) => r.id !== p.id))
  }

  const remove = (id: string) => setSelected((prev) => prev.filter((p) => p.id !== id))

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveCartUpsell(selected.map((p) => p.id))
      toast.success('Kasa arkası ürünler kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart size={16} className="text-[#222222]" />
            Kasa Arkası Ürünler
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sepet sayfasında gösterilecek ürünleri seçin. Boş bırakılırsa en uygun fiyatlı 10 ürün otomatik gösterilir.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white flex-shrink-0"
        >
          {saving ? <><Loader2 size={13} className="animate-spin mr-1.5" />Kaydediliyor</> : 'Kaydet'}
        </Button>
      </div>

      {/* Seçili ürünler */}
      {selected.length > 0 ? (
        <div className="space-y-2">
          {selected.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">—</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.price.toLocaleString('tr-TR')} ₺</p>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                aria-label="Kaldır"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 px-4 bg-muted/30 border border-dashed border-border rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            Henüz ürün seçilmedi — site otomatik olarak en uygun fiyatlı ürünleri gösterecek.
          </p>
        </div>
      )}

      {/* Ürün ara */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Ürün ara ve ekle..."
            className="pl-9 pr-8"
          />
          {isPending && (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
          )}
        </div>

        {results.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => add(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-md bg-muted overflow-hidden flex-shrink-0 relative">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="32px" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.price.toLocaleString('tr-TR')} ₺</p>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs text-[#222222] font-semibold flex-shrink-0">
                  <Plus size={12} /> Ekle
                </span>
              </button>
            ))}
          </div>
        )}

        {query.trim() && !isPending && results.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">Sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { SlideHotspot } from '@/types'
import { Plus, X } from 'lucide-react'

interface ProductResult {
  id: string
  name: string
  price: number
  sale_price: number | null
  images: string[]
  slug: string
}

interface HotspotEditorProps {
  imageUrl: string
  hotspots: SlideHotspot[]
  onChange: (hotspots: SlideHotspot[]) => void
  previewHeight?: number
}

export default function HotspotEditor({
  imageUrl,
  hotspots,
  onChange,
  previewHeight = 200,
}: HotspotEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [addingAt, setAddingAt] = useState<{ x: number; y: number } | null>(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, name, price, sale_price, images, slug')
        .eq('is_active', true)
        .ilike('name', `%${search}%`)
        .limit(6)
      setResults((data as ProductResult[]) ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (addingAt || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(1))
    const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(1))
    setAddingAt({ x, y })
    setSearch('')
    setResults([])
  }

  const confirmHotspot = (p: ProductResult) => {
    if (!addingAt) return
    onChange([...hotspots, {
      x: addingAt.x,
      y: addingAt.y,
      product_id: p.id,
      product_name: p.name,
      product_price: p.price,
      product_sale_price: p.sale_price,
      product_image_url: p.images?.[0] ?? null,
      product_slug: p.slug,
    }])
    setAddingAt(null)
    setSearch('')
    setResults([])
  }

  const cancelAdding = () => { setAddingAt(null); setSearch(''); setResults([]) }

  const removeHotspot = (index: number) => onChange(hotspots.filter((_, i) => i !== index))

  return (
    <div className="space-y-3 pt-1 border-t border-border/50">
      <div className="flex items-center justify-between">
        <Label>Ürün Noktaları</Label>
        {addingAt && (
          <button type="button" onClick={cancelAdding} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X size={12} /> İptal
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        {addingAt
          ? 'Hangi ürünü bağlamak istediğinizi arayın:'
          : 'Görsel üzerine tıklayarak ürün noktası ekleyin.'}
      </p>

      {/* Tıklanabilir görsel */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl overflow-hidden border border-border select-none ${addingAt ? 'cursor-default' : 'cursor-crosshair'}`}
        style={{ height: previewHeight }}
        onClick={handleImageClick}
      >
        <Image src={imageUrl} alt="Slayt görseli" fill className="object-cover pointer-events-none" sizes="600px" />

        {!addingAt && <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />}

        {hotspots.map((h, i) => (
          <div
            key={i}
            className="absolute pointer-events-none w-7 h-7 rounded-full bg-white/90 shadow border-2 border-white flex items-center justify-center text-xs font-bold text-black"
            style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {i + 1}
          </div>
        ))}

        {addingAt && (
          <div
            className="absolute pointer-events-none w-7 h-7 rounded-full bg-[#222222] shadow border-2 border-white flex items-center justify-center"
            style={{ left: `${addingAt.x}%`, top: `${addingAt.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Plus size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* Ürün arama */}
      {addingAt && (
        <div className="p-3 border border-border rounded-xl space-y-2 bg-background">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün adı ile ara..."
            autoFocus
          />
          {searching && <p className="text-xs text-muted-foreground py-1">Aranıyor...</p>}
          {results.length > 0 && (
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => confirmHotspot(p)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary text-left transition-colors"
                >
                  <div className="relative w-9 h-9 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {p.images?.[0] && (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="36px" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-[#222222]">
                      {(p.sale_price ?? p.price).toLocaleString('tr-TR')}₺
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {search && !searching && results.length === 0 && (
            <p className="text-xs text-muted-foreground">Ürün bulunamadı</p>
          )}
        </div>
      )}

      {/* Nokta listesi */}
      {hotspots.length > 0 && (
        <div className="space-y-1">
          {hotspots.map((h, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-2 bg-secondary/50 rounded-lg">
              <span className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-sm">{h.product_name}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {Math.round(h.x)}%, {Math.round(h.y)}%
              </span>
              <button
                type="button"
                onClick={() => removeHotspot(i)}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

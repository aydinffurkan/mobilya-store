'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, SlidersHorizontal } from 'lucide-react'

interface Props {
  slug: string
  initialQ: string
  initialMin: string
  initialMax: string
  initialSort: string
  totalCount: number
}

export default function CategoryPageFilter({
  slug,
  initialQ,
  initialMin,
  initialMax,
  initialSort,
  totalCount,
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [min, setMin] = useState(initialMin)
  const [max, setMax] = useState(initialMax)
  const [priceOpen, setPriceOpen] = useState(false)

  const push = useCallback(
    (overrides: Record<string, string>) => {
      const base = { q, min, max, sort: initialSort }
      const merged = { ...base, ...overrides }
      const params = new URLSearchParams()
      Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
      const qs = params.toString()
      router.push(`/kategori/${slug}${qs ? `?${qs}` : ''}`)
    },
    [q, min, max, initialSort, slug, router]
  )

  const hasFilters = initialQ || initialMin || initialMax

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Arama */}
        <form
          className="flex-1"
          onSubmit={(e) => { e.preventDefault(); push({ q }) }}
        >
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Bu kategoride ara..."
              className={`w-full pl-9 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/30 ${q ? 'pr-16' : 'pr-12'}`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {q && (
                <button
                  type="button"
                  onClick={() => { setQ(''); push({ q: '' }) }}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="submit"
                className="flex items-center justify-center w-7 h-7 bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white rounded-md transition-colors flex-shrink-0"
              >
                <Search size={13} />
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Fiyat filtresi */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPriceOpen(!priceOpen)}
              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                initialMin || initialMax
                  ? 'border-[#222222] bg-[#222222]/5 text-[#222222]'
                  : 'border-border hover:bg-secondary'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Fiyat</span>
              {(initialMin || initialMax) && (
                <span className="text-xs">
                  {initialMin ? `${Number(initialMin).toLocaleString('tr-TR')}₺` : '0'}
                  {' — '}
                  {initialMax ? `${Number(initialMax).toLocaleString('tr-TR')}₺` : '∞'}
                </span>
              )}
            </button>

            {priceOpen && (
              <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-border rounded-xl shadow-lg p-4 w-64">
                <p className="text-xs font-medium text-muted-foreground mb-3">Fiyat Aralığı (₺)</p>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    placeholder="Min"
                    min={0}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
                  />
                  <span className="text-muted-foreground text-sm flex-shrink-0">—</span>
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    placeholder="Max"
                    min={0}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { push({ min, max }); setPriceOpen(false) }}
                    className="flex-1 py-2 bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white text-sm rounded-lg transition-colors"
                  >
                    Uygula
                  </button>
                  {(min || max) && (
                    <button
                      type="button"
                      onClick={() => { setMin(''); setMax(''); push({ min: '', max: '' }); setPriceOpen(false) }}
                      className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sıralama */}
          <select
            value={initialSort}
            onChange={(e) => push({ sort: e.target.value })}
            className="px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
          >
            <option value="newest">En Yeni</option>
            <option value="featured">Öne Çıkanlar</option>
            <option value="price_asc">Fiyat: Düşük → Yüksek</option>
            <option value="price_desc">Fiyat: Yüksek → Düşük</option>
          </select>
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount === 0 ? 'Hiç ürün bulunamadı' : `${totalCount} ürün listeleniyor`}
          {initialQ && <span className="font-medium text-foreground"> — &quot;{initialQ}&quot;</span>}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQ(''); setMin(''); setMax(''); router.push(`/kategori/${slug}`) }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={13} /> Filtreleri Temizle
          </button>
        )}
      </div>
    </div>
  )
}
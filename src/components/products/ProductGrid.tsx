'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X, ChevronDown, Loader2 } from 'lucide-react'
import ProductCard from './ProductCard'
import { Category, Product } from '@/types'
import type { ProductFilters } from '@/lib/repositories/products'

const PAGE_SIZE = 20

type SortOption = NonNullable<ProductFilters['sort']>

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'En Yeni',
  featured: 'Öne Çıkanlar',
  price_asc: 'Fiyat: Düşük → Yüksek',
  price_desc: 'Fiyat: Yüksek → Düşük',
}

interface GridFilters {
  q: string
  category: string
  min: string
  max: string
  sort: SortOption
}

interface ProductGridProps {
  initialProducts: Product[]
  totalCount: number
  initialFilters: GridFilters
  filterCategories?: Pick<Category, 'id' | 'name' | 'slug'>[]
  lockedCategory?: string
  lockedSupplier?: string
  basePath: string
}

export default function ProductGrid({
  initialProducts,
  totalCount,
  initialFilters,
  filterCategories,
  lockedCategory,
  lockedSupplier,
  basePath,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [total, setTotal] = useState(totalCount)
  const [offset, setOffset] = useState(initialProducts.length)
  const [filters, setFilters] = useState<GridFilters>(initialFilters)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const filtersRef = useRef<GridFilters>(initialFilters)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const buildApiUrl = (f: GridFilters, off: number) => {
    const p = new URLSearchParams()
    if (f.q) p.set('q', f.q)
    const cat = lockedCategory ?? f.category
    if (cat) p.set('category', cat)
    if (f.min) p.set('min', f.min)
    if (f.max) p.set('max', f.max)
    if (f.sort) p.set('sort', f.sort)
    if (lockedSupplier) p.set('supplier', lockedSupplier)
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String(off))
    return `/api/products?${p}`
  }

  const updateUrl = (f: GridFilters) => {
    const p = new URLSearchParams()
    if (f.q) p.set('q', f.q)
    if (!lockedCategory && f.category) p.set('category', f.category)
    if (f.min) p.set('min', f.min)
    if (f.max) p.set('max', f.max)
    if (f.sort && f.sort !== 'newest') p.set('sort', f.sort)
    if (lockedSupplier) p.set('supplier', lockedSupplier)
    const qs = p.toString()
    window.history.replaceState({}, '', qs ? `${basePath}?${qs}` : basePath)
  }

  const doApply = async (f: GridFilters) => {
    setLoading(true)
    try {
      const res = await fetch(buildApiUrl(f, 0))
      const json = await res.json()
      setProducts(json.data ?? [])
      setTotal(json.meta?.total ?? 0)
      setOffset((json.data ?? []).length)
      updateUrl(f)
    } finally {
      setLoading(false)
    }
  }

  const applyImmediate = (partial: Partial<GridFilters>) => {
    const newFilters = { ...filtersRef.current, ...partial }
    filtersRef.current = newFilters
    setFilters(newFilters)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doApply(newFilters)
  }

  const applyDebounced = (partial: Partial<GridFilters>, delay = 400) => {
    const newFilters = { ...filtersRef.current, ...partial }
    filtersRef.current = newFilters
    setFilters(newFilters)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doApply(filtersRef.current), delay)
  }

  const clearAll = () => {
    applyImmediate({ q: '', category: '', min: '', max: '', sort: 'newest' })
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const res = await fetch(buildApiUrl(filtersRef.current, offset))
      const json = await res.json()
      const newProducts: Product[] = json.data ?? []
      setProducts((prev) => [...prev, ...newProducts])
      setOffset((prev) => prev + newProducts.length)
    } finally {
      setLoadingMore(false)
    }
  }

  const activeFilterCount = [
    filters.q,
    !lockedCategory && filters.category,
    filters.min,
    filters.max,
    filters.sort !== 'newest' && filters.sort,
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Filtre çubuğu */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Arama */}
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => applyDebounced({ q: e.target.value })}
              placeholder="Ürün ara..."
              className="w-full pl-9 pr-8 py-2.5 bg-neutral-50 rounded-xl text-sm border border-transparent focus:outline-none focus:bg-white focus:border-neutral-200 transition-colors"
            />
            {filters.q && (
              <button
                onClick={() => applyImmediate({ q: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Aramayı temizle"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Fiyat aralığı */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input
              type="number"
              value={filters.min}
              onChange={(e) => applyDebounced({ min: e.target.value }, 600)}
              placeholder="Min ₺"
              min={0}
              className="w-24 px-3 py-2.5 bg-neutral-50 rounded-xl text-sm border border-transparent focus:outline-none focus:bg-white focus:border-neutral-200 transition-colors"
            />
            <span className="text-neutral-300 select-none">—</span>
            <input
              type="number"
              value={filters.max}
              onChange={(e) => applyDebounced({ max: e.target.value }, 600)}
              placeholder="Max ₺"
              min={0}
              className="w-24 px-3 py-2.5 bg-neutral-50 rounded-xl text-sm border border-transparent focus:outline-none focus:bg-white focus:border-neutral-200 transition-colors"
            />
          </div>

          {/* Sıralama */}
          <div className="relative flex-shrink-0" ref={sortDropdownRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-xl text-sm border border-transparent hover:bg-neutral-100 transition-colors whitespace-nowrap"
            >
              {SORT_LABELS[filters.sort]}
              <ChevronDown
                size={14}
                className={`text-neutral-400 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-neutral-100 rounded-xl shadow-lg py-1 z-20 min-w-[200px]">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { applyImmediate({ sort: value }); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors ${
                      filters.sort === value ? 'text-[#222222] font-medium' : 'text-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kategori çipleri — sadece /urunler sayfasında */}
        {filterCategories && filterCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyImmediate({ category: '' })}
              className={`px-3.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                !filters.category
                  ? 'bg-[#222222] text-white border-[#222222]'
                  : 'border-neutral-200 text-neutral-600 hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222]'
              }`}
            >
              Tümü
            </button>
            {filterCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  applyImmediate({ category: filters.category === cat.slug ? '' : cat.slug })
                }
                className={`px-3.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filters.category === cat.slug
                    ? 'bg-[#222222] text-white border-[#222222]'
                    : 'border-neutral-200 text-neutral-600 hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sonuç satırı */}
      <div className="flex items-center justify-between text-sm px-0.5">
        <p className="text-neutral-500">
          {loading ? (
            <span className="inline-flex items-center gap-2 text-neutral-400">
              <Loader2 size={14} className="animate-spin" />
              Yükleniyor...
            </span>
          ) : (
            <>
              <span className="font-semibold text-neutral-900">{total}</span> ürün bulundu
            </>
          )}
        </p>
        {activeFilterCount > 0 && !loading && (
          <button
            onClick={clearAll}
            className="text-[#222222] hover:underline text-xs flex items-center gap-1"
          >
            <X size={12} />
            Filtreleri temizle ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Ürün grid */}
      <div
        className={`transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
      >
        {products.length === 0 && !loading ? (
          <div className="text-center py-24 text-neutral-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-neutral-700">Ürün bulunamadı</p>
            <p className="text-sm mt-1">Farklı bir arama veya filtre deneyin</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Daha Fazla Göster */}
      {!loading && offset < total && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-8 py-3 border-2 border-neutral-200 rounded-full text-sm font-medium text-neutral-700 hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222] transition-all duration-200 disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Yükleniyor...
              </>
            ) : (
              `Daha Fazla Göster (${total - offset} ürün kaldı)`
            )}
          </button>
        </div>
      )}
    </div>
  )
}
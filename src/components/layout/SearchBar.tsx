'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, Loader2, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { searchProducts, getPopularProducts, SearchResult } from '@/lib/actions/search'

// ── Typewriter ────────────────────────────────────────────────────────────────
const HINTS = ['yatak odası takımı', 'koltuk takımı', 'tv ünitesi', 'çalışma masası', 'bebek odası']

function useTypewriter(active: boolean) {
  const [display, setDisplay] = useState('')
  const [hintIdx, setHintIdx] = useState(0)
  const [phase,   setPhase]   = useState<'typing' | 'pause' | 'deleting'>('typing')
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    if (!active) { setDisplay(''); return }
    const word = HINTS[hintIdx % HINTS.length]
    if (phase === 'typing') {
      if (charIdx < word.length) {
        const t = setTimeout(() => { setDisplay(word.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, 80)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('pause'), 1600)
      return () => clearTimeout(t)
    }
    if (phase === 'pause') {
      const t = setTimeout(() => setPhase('deleting'), 500)
      return () => clearTimeout(t)
    }
    if (phase === 'deleting') {
      if (charIdx > 0) {
        const t = setTimeout(() => { setDisplay(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1) }, 40)
        return () => clearTimeout(t)
      }
      setHintIdx(i => i + 1); setPhase('typing')
    }
  }, [active, phase, charIdx, hintIdx])
  return display
}

function useDebounce<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t) }, [value, ms])
  return d
}

// ── Recent searches (localStorage) ───────────────────────────────────────────
const LS_KEY = 'search_history'
function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}
function addHistory(q: string) {
  const prev = getHistory().filter(h => h !== q)
  localStorage.setItem(LS_KEY, JSON.stringify([q, ...prev].slice(0, 6)))
}
function removeHistory(q: string) {
  localStorage.setItem(LS_KEY, JSON.stringify(getHistory().filter(h => h !== q)))
}
function clearHistory() { localStorage.removeItem(LS_KEY) }

// ── Popular searches ──────────────────────────────────────────────────────────
const POPULAR_SEARCHES = ['Sandalye', 'Koltuk Takımı', 'TV Ünitesi', 'Kitaplık', 'Çalışma Masası', 'Gardırop', 'Yemek Masası']
const POPULAR_CATS = ['Köşe Koltuk', 'Yatak Odası', 'Koltuk Takımı', 'Gardırop', 'Yemek Odası']

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { mobile?: boolean; borderless?: boolean; onClose?: () => void }

export default function SearchBar({ mobile = false, borderless = false, onClose }: Props) {
  const router       = useRouter()
  const inputRef     = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState<SearchResult[]>([])
  const [popularProds, setPopularProds] = useState<SearchResult[]>([])
  const [loading,      setLoading]      = useState(false)
  const [open,         setOpen]         = useState(false)
  const [activeIdx,    setActiveIdx]    = useState(-1)
  const [focused,      setFocused]      = useState(false)
  const [history,      setHistory]      = useState<string[]>([])
  const [prodPage,     setProdPage]     = useState(0)

  const PRODS_PER_PAGE = 4

  const debouncedQuery = useDebounce(query, 260)
  const placeholder    = useTypewriter(!focused && query === '')
  const showDefault    = !mobile && focused && query.length === 0
  const showResults    = open && query.length >= 2

  // Popüler ürünleri bir kez yükle
  useEffect(() => {
    getPopularProducts().then(setPopularProds)
  }, [])

  // Geçmiş aramaları fokus anında oku
  useEffect(() => {
    if (focused) setHistory(getHistory())
  }, [focused])

  // Arama
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); setOpen(false); return }
    let cancelled = false
    setLoading(true)
    searchProducts(debouncedQuery).then(r => {
      if (cancelled) return
      setResults(r); setOpen(true); setActiveIdx(-1); setLoading(false)
    })
    return () => { cancelled = true }
  }, [debouncedQuery])

  // Dışarı tıklama (mouse + touch)
  useEffect(() => {
    const h = (e: MouseEvent | TouchEvent) => {
      const target = 'touches' in e ? e.touches[0]?.target : (e as MouseEvent).target
      if (containerRef.current && !containerRef.current.contains(target as Node)) {
        setOpen(false); setFocused(false)
      }
    }
    document.addEventListener('mousedown', h)
    document.addEventListener('touchstart', h as EventListener)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('touchstart', h as EventListener)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) { navigate(`/urunler/${results[activeIdx].slug}`) }
      else if (query.trim()) { doSearch(query.trim()) }
    }
    else if (e.key === 'Escape') { setOpen(false); setFocused(false) }
  }

  const clear = useCallback(() => {
    setQuery(''); setResults([]); setOpen(false); setActiveIdx(-1); onClose?.()
  }, [onClose])

  const navigate = (href: string) => { router.push(href); clear() }

  const doSearch = (q: string) => {
    if (!q.trim()) return
    addHistory(q.trim())
    navigate(`/urunler?q=${encodeURIComponent(q.trim())}`)
  }

  const handleHistoryRemove = (q: string) => {
    removeHistory(q); setHistory(getHistory())
  }
  const handleHistoryClear = () => { clearHistory(); setHistory([]) }

  const dropdownOpen = showDefault || showResults

  return (
    <div ref={containerRef} className={`relative ${mobile ? 'w-full' : borderless ? 'w-full max-w-[520px]' : 'w-full max-w-xs'}`}>

      {/* Input */}
      <div className={`relative flex items-center transition-all duration-200 ${
        mobile
          ? 'bg-neutral-100 rounded-xl'
          : borderless
            ? `border-b ${focused ? 'border-neutral-400' : 'border-transparent'}`
            : `bg-neutral-50 rounded-full border ${focused ? 'border-neutral-300 bg-white shadow-sm' : 'border-transparent'}`
      }`}>
        <Search size={14} className="absolute left-4 text-neutral-400 pointer-events-none flex-shrink-0" />

        {!focused && query === '' && (
          <div className="absolute left-10 right-9 pointer-events-none overflow-hidden whitespace-nowrap">
            <span className="text-xs text-neutral-400">
              {placeholder}
              <span className="animate-pulse ml-px border-r border-neutral-400 h-3 inline-block" />
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { if (!showResults) {} }}
          onKeyDown={handleKeyDown}
          placeholder={focused ? 'Ne arıyorsunuz?' : ''}
          className={`w-full pl-10 pr-9 py-2.5 bg-transparent text-xs text-neutral-800 placeholder:text-neutral-300 focus:outline-none ${mobile ? 'rounded-xl' : 'rounded-full'}`}
          autoComplete="off" spellCheck={false} autoFocus={mobile}
        />

        <div className="absolute right-3 flex items-center">
          {loading && <Loader2 size={13} className="animate-spin text-neutral-400" />}
          {!loading && query && (
            <button type="button" onClick={clear} className="text-neutral-400 hover:text-neutral-700 transition-colors p-0.5">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className={`absolute z-50 bg-white border border-neutral-100 rounded-2xl shadow-2xl overflow-hidden
          ${mobile ? 'top-full mt-2 left-0 right-0' : 'top-full mt-3 left-1/2 -translate-x-1/2 w-[680px]'}`}
        >

          {/* ── Varsayılan panel (boş sorgu) ── */}
          {showDefault && !showResults && (
            <div className="flex divide-x divide-neutral-100">

              {/* SOL: Aramalar + Kategoriler + Geçmiş */}
              <div className="flex-1 min-w-0 p-5 space-y-5">

                {/* Popüler Aramalar */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2.5">Popüler Aramalar</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map(s => (
                      <button key={s} onClick={() => doSearch(s)}
                        className="px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popüler Kategoriler */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2.5">Popüler Kategoriler</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CATS.map(c => (
                      <button key={c} onClick={() => navigate(`/urunler?q=${encodeURIComponent(c)}`)}
                        className="px-3 py-1.5 text-xs font-medium border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-600 rounded-full transition-colors">
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geçmiş Aramalar */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Geçmiş Aramalar</p>
                      <button onClick={handleHistoryClear} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-red-500 transition-colors">
                        <Trash2 size={10} /> Temizle
                      </button>
                    </div>
                    <div className="space-y-1">
                      {history.map(h => (
                        <div key={h} className="flex items-center gap-2 group">
                          <button onClick={() => doSearch(h)}
                            className="flex items-center gap-2 flex-1 text-left py-1 text-sm text-neutral-600 hover:text-neutral-900 transition-colors min-w-0">
                            <Clock size={12} className="text-neutral-300 flex-shrink-0" />
                            <span className="truncate">{h}</span>
                          </button>
                          <button onClick={() => handleHistoryRemove(h)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-neutral-600 p-0.5 flex-shrink-0">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SAĞ: Popüler Ürünler (carousel) */}
              {popularProds.length > 0 && (() => {
                const totalPages = Math.ceil(popularProds.length / PRODS_PER_PAGE)
                const pageItems  = popularProds.slice(prodPage * PRODS_PER_PAGE, (prodPage + 1) * PRODS_PER_PAGE)
                return (
                  <div className="w-[240px] flex-shrink-0 p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Popüler Ürünler</p>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setProdPage(p => Math.max(0, p - 1))}
                            disabled={prodPage === 0}
                            className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-[10px] text-neutral-400 tabular-nums w-7 text-center">
                            {prodPage + 1}/{totalPages}
                          </span>
                          <button
                            onClick={() => setProdPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={prodPage === totalPages - 1}
                            className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {pageItems.map(p => (
                        <button key={p.id} onClick={() => navigate(`/urunler/${p.slug}`)}
                          className="flex items-center gap-3 w-full text-left group hover:bg-neutral-50 rounded-xl p-1.5 -mx-1.5 transition-colors">
                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-100">
                            {p.images[0]
                              ? <Image src={p.images[0]} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-neutral-200" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-neutral-800 line-clamp-2 leading-snug group-hover:text-neutral-600">{p.name}</p>
                            <p className="text-xs font-semibold text-[#222222] mt-0.5">
                              {(p.sale_price ?? p.price).toLocaleString('tr-TR')} ₺
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* Sayfa noktaları */}
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-1 mt-3">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button key={i} onClick={() => setProdPage(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === prodPage ? 'bg-neutral-700' : 'bg-neutral-200 hover:bg-neutral-400'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── Arama sonuçları ── */}
          {showResults && (
            <>
              {results.length === 0 && !loading && (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-neutral-500"><span className="font-medium text-neutral-700">&quot;{query}&quot;</span> için sonuç bulunamadı.</p>
                  <p className="text-xs text-neutral-400 mt-1">Farklı bir arama deneyin.</p>
                </div>
              )}

              {results.length > 0 && (
                <>
                  <div className="px-4 py-2.5 border-b border-neutral-50">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400">Ürünler ({results.length})</p>
                  </div>
                  <ul className="divide-y divide-neutral-50 max-h-[420px] overflow-y-auto overscroll-contain">
                    {results.map((r, i) => (
                      <li key={r.id}>
                        <button type="button"
                          onClick={() => { addHistory(query); navigate(`/urunler/${r.slug}`) }}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors ${activeIdx === i ? 'bg-neutral-50' : 'hover:bg-neutral-50/70'}`}
                        >
                          <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100">
                            {r.images[0]
                              ? <Image src={r.images[0]} alt={r.name} width={48} height={48} className="object-cover w-full h-full" />
                              : <div className="w-full h-full flex items-center justify-center"><Search size={14} className="text-neutral-300" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            {r.category_name && <p className="text-[10px] text-neutral-400 mb-0.5">{r.category_name}</p>}
                            <p className="text-sm font-medium text-neutral-800 line-clamp-1">{r.name}</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-sm font-semibold text-[#222222]">{(r.sale_price ?? r.price).toLocaleString('tr-TR')} ₺</span>
                              {r.sale_price && <span className="text-xs text-neutral-400 line-through">{r.price.toLocaleString('tr-TR')} ₺</span>}
                            </div>
                          </div>
                          <span className={`text-xs text-neutral-300 flex-shrink-0 transition-colors ${activeIdx === i ? 'text-[#222222]' : ''}`}>→</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-neutral-100 px-4 py-2.5">
                    <button type="button" onClick={() => { addHistory(query); doSearch(query) }}
                      className="text-xs font-medium text-[#222222] hover:underline flex items-center gap-1">
                      &quot;{query}&quot; için tüm sonuçları gör →
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      )}
    </div>
  )
}

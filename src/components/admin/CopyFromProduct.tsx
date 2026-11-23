'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { searchProductsForCopy } from '@/app/admin/urunler/actions'

interface Props<T> {
  kind: 'dimensions' | 'specs'
  excludeId?: string
  /** mode: replace = mevcutları sil, append = mevcutların altına ekle */
  onApply: (items: T[], mode: 'replace' | 'append') => void
}

interface Result<T> { id: string; name: string; items: T[] }

export default function CopyFromProduct<T>({ kind, excludeId, onApply }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result<T>[]>([])
  const [loading, setLoading] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    if (!open) return
    const id = ++reqId.current
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const data = await searchProductsForCopy(query, kind, excludeId)
        if (id === reqId.current) setResults(data as Result<T>[])
      } catch (e) {
        if (id === reqId.current) toast.error(e instanceof Error ? e.message : 'Arama başarısız')
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [open, query, kind, excludeId])

  const apply = (r: Result<T>, mode: 'replace' | 'append') => {
    onApply(r.items.map((i) => ({ ...i })), mode)
    toast.success(`"${r.name}" ürününden ${r.items.length} satır ${mode === 'replace' ? 'uygulandı' : 'eklendi'}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-muted-foreground hover:text-foreground"
      >
        <Copy size={12} /> Başka Üründen Al
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-white p-3 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı ara..."
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
            />
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 py-1"><Loader2 size={12} className="animate-spin" /> Aranıyor...</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              {kind === 'dimensions' ? 'Ölçüsü girilmiş' : 'Özelliği girilmiş'} ürün bulunamadı.
            </p>
          ) : (
            <ul className="divide-y divide-border max-h-64 overflow-y-auto">
              {results.map((r) => (
                <li key={r.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.items.length} satır</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button type="button" onClick={() => apply(r, 'append')} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/60">
                      Ekle
                    </button>
                    <button type="button" onClick={() => apply(r, 'replace')} className="text-xs px-2.5 py-1.5 rounded-lg bg-[#222222] text-white hover:opacity-90">
                      Değiştir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

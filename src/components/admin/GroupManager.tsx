'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Search, Loader2, Link2, Trash2 } from 'lucide-react'
import {
  searchProductsForGroup, addToGroup, removeFromGroup, setGroupLabel, getGroupMembers,
  type GroupProductLite,
} from '@/app/admin/urunler/actions'

export default function GroupManager({ productId, initialLabel }: { productId: string; initialLabel: string | null }) {
  const router = useRouter()
  const [label, setLabel]       = useState(initialLabel ?? '')
  const [members, setMembers]   = useState<GroupProductLite[]>([])
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<GroupProductLite[]>([])
  const [searching, setSearching] = useState(false)
  const [busy, setBusy]         = useState(false)

  const loadMembers = useCallback(async () => {
    try { setMembers(await getGroupMembers(productId)) } catch { /* yoksay */ }
  }, [productId])

  useEffect(() => { void loadMembers() }, [loadMembers])

  const doSearch = async () => {
    if (query.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try { setResults(await searchProductsForGroup(query)) }
    finally { setSearching(false) }
  }

  const handleAdd = async (targetId: string) => {
    setBusy(true)
    try {
      await addToGroup(productId, targetId)
      toast.success('Ürün gruba eklendi')
      setQuery(''); setResults([])
      await loadMembers()
      router.refresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Eklenemedi') }
    finally { setBusy(false) }
  }

  const handleRemove = async (memberId: string) => {
    setBusy(true)
    try {
      await removeFromGroup(memberId)
      toast.success('Ürün gruptan çıkarıldı')
      await loadMembers()
      router.refresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Çıkarılamadı') }
    finally { setBusy(false) }
  }

  const saveLabel = async () => {
    try { await setGroupLabel(productId, label); toast.success('Etiket kaydedildi'); router.refresh() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Kaydedilemedi') }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-5">
      <div>
        <h3 className="font-semibold">Seçenek Grubu (Bağlı Ürünler)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bu ürünü farklı ölçü/kurulum ürünleriyle grupla. Müşteri detay sayfasında seçeneklere tıklayınca ilgili ürünün sayfası açılır.
        </p>
      </div>

      {/* Bu ürünün grup etiketi */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Bu üründeki seçenek etiketi</label>
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='örn. "190x92" veya "8 Sandalyeli"'
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
          <button type="button" onClick={saveLabel} className="px-4 bg-[#222222] text-white rounded-xl text-sm hover:opacity-90">Kaydet</button>
        </div>
        <p className="text-[11px] text-muted-foreground">Seçenek kartında görünecek kısa etiket. Boşsa ürün adı kullanılır.</p>
      </div>

      {/* Arama ile ekle */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Gruba ürün ekle</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void doSearch() } }}
              placeholder="Ürün adı ara..."
              className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
            />
          </div>
          <button type="button" onClick={() => void doSearch()} className="px-4 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm flex items-center">
            {searching ? <Loader2 size={15} className="animate-spin" /> : 'Ara'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="border border-border rounded-xl divide-y divide-border mt-1 max-h-60 overflow-y-auto">
            {results.filter((r) => r.id !== productId).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => void handleAdd(r.id)}
                disabled={busy}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 text-left disabled:opacity-50"
              >
                <div className="relative w-9 h-9 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                  {r.images?.[0] && <Image src={r.images[0]} alt="" fill className="object-cover" sizes="36px" />}
                </div>
                <span className="text-sm flex-1 truncate">{r.name}</span>
                {r.variant_group_id && <span className="text-[10px] text-amber-600 flex-shrink-0">zaten grupta</span>}
                <Link2 size={14} className="text-neutral-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grup üyeleri */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Gruptaki diğer ürünler ({members.length})</label>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Henüz bağlı ürün yok.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 border border-border rounded-xl px-3 py-2">
                <div className="relative w-9 h-9 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                  {m.images?.[0] && <Image src={m.images[0]} alt="" fill className="object-cover" sizes="36px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.variant_group_label || '(etiket yok)'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(m.id)}
                  disabled={busy}
                  className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

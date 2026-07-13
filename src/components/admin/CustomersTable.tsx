'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  customers: { user: any; profile: any; orderCount: number; totalSpent: number }[]
}

type Segment = 'all' | 'vip' | 'aktif' | 'yeni' | 'inaktif'

function getAutoSegment(orderCount: number, totalSpent: number, createdAt: string): Segment {
  if (totalSpent >= 5000) return 'vip'
  if (orderCount > 0) return 'aktif'
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / 86400000
  return daysSince <= 30 ? 'yeni' : 'inaktif'
}

const segmentMeta: Record<Segment, { label: string; cls: string }> = {
  all:     { label: 'Tümü',    cls: '' },
  vip:     { label: 'VIP',     cls: 'bg-amber-100 text-amber-700' },
  aktif:   { label: 'Aktif',   cls: 'bg-green-100 text-green-700' },
  yeni:    { label: 'Yeni',    cls: 'bg-blue-100 text-blue-700'   },
  inaktif: { label: 'İnaktif', cls: 'bg-gray-100 text-gray-500'   },
}

type SortKey = 'name' | 'date' | 'orders' | 'spent'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

export default function CustomersTable({ customers }: Props) {
  const [search, setSearch]       = useState('')
  const [segment, setSegment]     = useState<Segment>('all')
  const [sortKey, setSortKey]     = useState<SortKey>('date')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [page, setPage]           = useState(1)

  const filtered = useMemo(() => {
    let list = customers
    if (segment !== 'all') {
      // prefer admin-set tag, fall back to auto-segment
      list = list.filter(({ user, profile, orderCount, totalSpent }) => {
        const adminTag = profile?.admin_tag as string | null
        const seg = adminTag ?? getAutoSegment(orderCount, totalSpent, user.created_at)
        return seg === segment
      })
    }
    const q = search.toLowerCase()
    if (!q) return list
    return list.filter(
      ({ user, profile }) =>
        (profile?.full_name ?? '').toLowerCase().includes(q) ||
        (user.email ?? '').toLowerCase().includes(q)
    )
  }, [customers, search, segment])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'name': return (a.profile?.full_name ?? a.user.email ?? '').localeCompare(b.profile?.full_name ?? b.user.email ?? '', 'tr') * dir
        case 'date': return (new Date(a.user.created_at).getTime() - new Date(b.user.created_at).getTime()) * dir
        case 'orders': return (a.orderCount - b.orderCount) * dir
        case 'spent': return (a.totalSpent - b.totalSpent) * dir
        default: return 0
      }
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [sorted, currentPage])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={12} className="text-muted-foreground/50" />
    return dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  return (
    <>
      {/* Segment pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(segmentMeta) as Segment[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSegment(s); setPage(1) }}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
              segment === s
                ? s === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : segmentMeta[s].cls + ' border-current ring-2 ring-offset-1 ring-current'
                : 'bg-white text-muted-foreground border-border hover:border-foreground/30'
            }`}
          >
            {segmentMeta[s].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="İsim veya e-posta ara..."
            className="pl-9"
          />
        </div>
        {(search || segment !== 'all') && (
          <button onClick={() => { setSearch(''); setSegment('all'); setPage(1) }} className="text-xs text-muted-foreground hover:text-foreground underline">
            Filtreleri temizle
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} / {customers.length} üye</span>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Henüz kayıtlı üye yok.</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Aramanızla eşleşen üye bulunamadı.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-foreground">
                      Üye <SortIcon active={sortKey === 'name'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('date')} className="flex items-center gap-1.5 hover:text-foreground">
                      Kayıt Tarihi <SortIcon active={sortKey === 'date'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('orders')} className="flex items-center gap-1.5 hover:text-foreground">
                      Sipariş <SortIcon active={sortKey === 'orders'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('spent')} className="flex items-center gap-1.5 hover:text-foreground">
                      Toplam Harcama <SortIcon active={sortKey === 'spent'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(({ user, profile, orderCount, totalSpent }) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{profile?.full_name || '—'}</p>
                        {(() => {
                          const adminTag = profile?.admin_tag as string | null
                          const seg = (adminTag ?? getAutoSegment(orderCount, totalSpent, user.created_at)) as Segment
                          if (seg === 'all') return null
                          return (
                            <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold ${segmentMeta[seg]?.cls ?? ''}`}>
                              {segmentMeta[seg]?.label ?? seg}
                            </span>
                          )
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">{orderCount} sipariş</td>
                    <td className="px-4 py-3 font-semibold text-[#222222]">
                      {totalSpent.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/musteriler/${user.id}`} className="text-xs text-[#222222] hover:underline font-medium">
                        Görüntüle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Sayfa {currentPage} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

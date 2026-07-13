'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { bulkUpdateOrderStatus, updateOrderStatus } from '@/app/admin/siparisler/actions'
import { toast } from 'sonner'

const statusLabel: Record<string, string> = {
  pending:          'Beklemede',
  pending_payment:  'Ödeme Bekleniyor',
  pending_transfer: 'Havale Bekleniyor',
  confirmed:        'Onaylandı',
  shipped:          'Kargoda',
  delivered:        'Teslim Edildi',
  cancelled:        'İptal',
  payment_failed:   'Ödeme Başarısız',
}

const statusColor: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending_payment:  'bg-orange-100 text-orange-700 border-orange-200',
  pending_transfer: 'bg-violet-100 text-violet-700 border-violet-200',
  confirmed:        'bg-blue-100 text-blue-700 border-blue-200',
  shipped:          'bg-purple-100 text-purple-700 border-purple-200',
  delivered:        'bg-green-100 text-green-700 border-green-200',
  cancelled:        'bg-red-100 text-red-700 border-red-200',
  payment_failed:   'bg-red-100 text-red-700 border-red-200',
}

type DateRange = 'all' | 'today' | 'week' | 'month'
type SortKey   = 'id' | 'customer' | 'status' | 'total' | 'date'
type SortDir   = 'asc' | 'desc'

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Bugün' },
  { key: 'week',  label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
  { key: 'all',   label: 'Tümü' },
]

const PAGE_SIZE = 10

function isInRange(dateStr: string, range: DateRange): boolean {
  if (range === 'all') return true
  const d = new Date(dateStr)
  const now = new Date()
  if (range === 'today') {
    return d.toDateString() === now.toDateString()
  }
  if (range === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }
  if (range === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }
  return true
}

function InlineStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [value, setValue] = useState(status)
  const [busy,  setBusy]  = useState(false)

  const handleChange = async (next: string) => {
    if (next === value) return
    setBusy(true)
    try {
      await updateOrderStatus(orderId, next)
      setValue(next)
      toast.success(`Durum güncellendi: ${statusLabel[next]}`)
    } catch {
      toast.error('Durum güncellenemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      {busy && <Loader2 size={12} className="absolute left-2 text-muted-foreground animate-spin z-10" />}
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={busy}
        className={`appearance-none h-6 pl-2.5 pr-5 rounded-full text-[11px] font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#222222]/30 disabled:opacity-60 transition-all ${statusColor[value] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
      >
        {Object.entries(statusLabel).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}

export default function OrdersTable({ orders }: { orders: any[] }) {
  const [search,    setSearch]    = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [sortKey,   setSortKey]   = useState<SortKey>('date')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')
  const [page,      setPage]      = useState(1)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [bulkBusy,  setBulkBusy]  = useState(false)
  const [bulkStatus, setBulkStatus] = useState('confirmed')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase().replace(/^#/, '')
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.shipping_address?.full_name ?? '').toLowerCase().includes(q) ||
        (o.shipping_address?.phone ?? '').toLowerCase().includes(q)
      return matchesSearch && isInRange(o.created_at, dateRange)
    })
  }, [orders, search, dateRange])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'id':       return a.id.localeCompare(b.id) * dir
        case 'customer': return (a.shipping_address?.full_name ?? '').localeCompare(b.shipping_address?.full_name ?? '', 'tr') * dir
        case 'status':   return a.status.localeCompare(b.status) * dir
        case 'total':    return (Number(a.total) - Number(b.total)) * dir
        case 'date':     return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
        default:         return 0
      }
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged       = useMemo(() => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [sorted, currentPage])

  const resetToFirstPage = () => setPage(1)

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

  const allOnPageSelected = paged.length > 0 && paged.every((o) => selected.has(o.id))

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) paged.forEach((o) => next.delete(o.id))
      else                   paged.forEach((o) => next.add(o.id))
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const handleBulkStatusChange = async () => {
    if (selected.size === 0) return
    setBulkBusy(true)
    try {
      await bulkUpdateOrderStatus(Array.from(selected), bulkStatus)
      toast.success(`${selected.size} sipariş "${statusLabel[bulkStatus]}" olarak güncellendi`)
      clearSelection()
    } catch (e: any) {
      toast.error('Toplu güncelleme başarısız: ' + e.message)
    } finally {
      setBulkBusy(false)
    }
  }

  const hasFilters = search || dateRange !== 'all'

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-4">
        {/* Date range pills */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => { setDateRange(r.key); resetToFirstPage() }}
              className={`h-8 px-4 rounded-full text-xs font-medium border transition-all ${
                dateRange === r.key
                  ? 'bg-[#222222] text-white border-[#222222]'
                  : 'bg-white text-muted-foreground border-border hover:border-[#222222]/40 hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} / {orders.length} sipariş</span>
        </div>

        {/* Search row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDateRange('all'); resetToFirstPage() }}
              placeholder="Sipariş no, müşteri adı veya telefon..."
              className="pl-9"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setDateRange('all'); resetToFirstPage() }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-[#222222]/10 border border-[#222222]/30 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-[#222222]">{selected.size} sipariş seçildi</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 px-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
            >
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={handleBulkStatusChange}>Durumu Güncelle</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Vazgeç</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Henüz sipariş bulunmuyor.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Aramanızla eşleşen sipariş bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        className="accent-[#222222] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('id')} className="flex items-center gap-1.5 hover:text-foreground">
                        Sipariş No <SortIcon active={sortKey === 'id'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('customer')} className="flex items-center gap-1.5 hover:text-foreground">
                        Müşteri <SortIcon active={sortKey === 'customer'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 hover:text-foreground">
                        Durum <SortIcon active={sortKey === 'status'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('total')} className="flex items-center gap-1.5 hover:text-foreground">
                        Toplam <SortIcon active={sortKey === 'total'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1.5 hover:text-foreground">
                        Tarih <SortIcon active={sortKey === 'date'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-medium">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((order) => (
                    <tr
                      key={order.id}
                      className={`hover:bg-secondary/20 transition-colors ${selected.has(order.id) ? 'bg-[#222222]/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelectOne(order.id)}
                          className="accent-[#222222] w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.shipping_address?.full_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{order.shipping_address?.phone ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <InlineStatusSelect orderId={order.id} status={order.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#222222]">
                        {Number(order.total).toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/siparisler/${order.id}`}
                          className="text-xs text-[#222222] hover:underline font-medium"
                        >
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
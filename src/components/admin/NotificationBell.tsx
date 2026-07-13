'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, ShoppingBag, AlertTriangle, UserPlus, Headphones, Landmark } from 'lucide-react'

export interface Activity {
  id: string
  type: 'order' | 'low_stock' | 'customer' | 'support' | 'transfer'
  title: string
  subtitle: string
  href: string
  date: string
}

export interface NotificationCounts {
  orders: number
  transfers: number
  tickets: number
}

const iconByType = {
  order:     ShoppingBag,
  low_stock: AlertTriangle,
  customer:  UserPlus,
  support:   Headphones,
  transfer:  Landmark,
}

const colorByType = {
  order:     'text-blue-600 bg-blue-50',
  low_stock: 'text-red-600 bg-red-50',
  customer:  'text-green-600 bg-green-50',
  support:   'text-orange-600 bg-orange-50',
  transfer:  'text-violet-600 bg-violet-50',
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'az önce'
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

interface Props {
  urgentCount: number
  counts: NotificationCounts
  activities: Activity[]
}

export default function NotificationBell({ urgentCount, counts, activities }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors"
        aria-label="Bildirimler"
      >
        <Bell size={18} className="text-muted-foreground" />
        {urgentCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {urgentCount > 99 ? '99+' : urgentCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-50">

          {/* Başlık + özet rozetler */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Bildirimler</h3>
              {urgentCount > 0 && (
                <span className="text-[11px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {urgentCount} bekliyor
                </span>
              )}
            </div>
            {(counts.tickets > 0 || counts.orders > 0 || counts.transfers > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {counts.tickets > 0 && (
                  <Link
                    href="/admin/destek"
                    onClick={() => setOpen(false)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors"
                  >
                    {counts.tickets} destek talebi
                  </Link>
                )}
                {counts.orders > 0 && (
                  <Link
                    href="/admin/siparisler"
                    onClick={() => setOpen(false)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors"
                  >
                    {counts.orders} yeni sipariş
                  </Link>
                )}
                {counts.transfers > 0 && (
                  <Link
                    href="/admin/siparisler"
                    onClick={() => setOpen(false)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium hover:bg-violet-200 transition-colors"
                  >
                    {counts.transfers} havale bekliyor
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Aktivite listesi */}
          {activities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Henüz aktivite yok.</p>
          ) : (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
              {activities.map((a) => {
                const Icon = iconByType[a.type]
                return (
                  <Link
                    key={a.id}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${colorByType[a.type]}`}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{a.subtitle}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(a.date)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Alt link */}
          <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center justify-between">
            <Link
              href="/admin/destek"
              onClick={() => setOpen(false)}
              className="text-xs text-orange-600 font-medium hover:text-orange-800 transition-colors"
            >
              Tüm destek taleplerine git →
            </Link>
            <Link
              href="/admin/siparisler"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Siparişler →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

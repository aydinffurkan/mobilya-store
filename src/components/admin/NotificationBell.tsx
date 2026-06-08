'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, ShoppingBag, AlertTriangle, UserPlus } from 'lucide-react'

interface Activity {
  id: string
  type: 'order' | 'low_stock' | 'customer'
  title: string
  subtitle: string
  href: string
  date: string
}

const iconByType = {
  order: ShoppingBag,
  low_stock: AlertTriangle,
  customer: UserPlus,
}

const colorByType = {
  order: 'text-blue-600 bg-blue-50',
  low_stock: 'text-red-600 bg-red-50',
  customer: 'text-green-600 bg-green-50',
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

export default function NotificationBell({ pendingOrderCount, activities }: { pendingOrderCount: number; activities: Activity[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors"
      >
        <Bell size={18} className="text-muted-foreground" />
        {pendingOrderCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Aktiviteler</h3>
            {pendingOrderCount > 0 && (
              <span className="text-xs text-red-600 font-medium">{pendingOrderCount} bekleyen sipariş</span>
            )}
          </div>
          {activities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Henüz aktivite yok.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {activities.map((a) => {
                const Icon = iconByType[a.type]
                return (
                  <Link
                    key={a.id}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className={`p-1.5 rounded-lg ${colorByType[a.type]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.subtitle}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(a.date)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

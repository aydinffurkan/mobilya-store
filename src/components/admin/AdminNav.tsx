'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Settings, Wrench, Search, Layers, Home, Truck, Newspaper, HeadphonesIcon, CreditCard, Coins } from 'lucide-react'

interface NavLeaf {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

interface NavGroup {
  label: string
  icon: React.ComponentType<{ size?: number }>
  children: NavLeaf[]
}

type NavEntry = NavLeaf | NavGroup

const isGroup = (entry: NavEntry): entry is NavGroup => !('href' in entry)

const navItems: NavEntry[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/tedarikciler', label: 'Tedarikçiler', icon: Truck },
  { href: '/admin/sablonlar', label: 'Şablonlar', icon: Layers },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: Tag },
  { href: '/admin/siparisler', label: 'Siparişler', icon: ShoppingBag },
  { href: '/admin/musteriler', label: 'Müşteriler', icon: Users },
  { href: '/admin/destek',    label: 'Destek Talepleri', icon: HeadphonesIcon },
  { href: '/admin/odeme',    label: 'Ödeme Yöntemleri', icon: CreditCard },
  { href: '/admin/puanlar',  label: 'MessaPuan',         icon: Coins      },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/seo', label: 'SEO Ayarları', icon: Search },
  {
    label: 'Site Ayarları',
    icon: Settings,
    children: [
      { href: '/admin/ayarlar', label: 'Anasayfa', icon: Home },
      { href: '/admin/hizmetler', label: 'Hizmetler', icon: Wrench },
    ],
  },
]

export default function AdminNav({ pendingTickets = 0, pendingOrders = 0 }: { pendingTickets?: number; pendingOrders?: number }) {
  const pathname = usePathname()

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map((entry) => {
        if (isGroup(entry)) {
          const { label, icon: Icon, children } = entry
          return (
            <div key={label}>
              <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500">
                <Icon size={16} />
                {label}
              </div>
              <div className="ml-4 pl-3 border-l border-gray-700 space-y-1">
                {children.map((child) => {
                  const childActive = isActive(child.href)
                  const ChildIcon = child.icon
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        childActive
                          ? 'bg-[#222222] text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <ChildIcon size={14} />
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        }

        const { href, label, icon: Icon } = entry
        const active = isActive(href)
        const isDestek     = href === '/admin/destek'
        const isSiparisler = href === '/admin/siparisler'
        const badge = isDestek ? pendingTickets : isSiparisler ? pendingOrders : 0
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-[#222222] text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold leading-none ${
                isDestek ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

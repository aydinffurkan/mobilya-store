'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Settings, Wrench, Search, ListTree } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/varyantlar', label: 'Varyantlar', icon: ListTree },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: Tag },
  { href: '/admin/siparisler', label: 'Siparişler', icon: ShoppingBag },
  { href: '/admin/musteriler', label: 'Müşteriler', icon: Users },
  { href: '/admin/hizmetler', label: 'Hizmetler', icon: Wrench },
  { href: '/admin/seo', label: 'SEO Ayarları', icon: Search },
  { href: '/admin/ayarlar', label: 'Site Ayarları', icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-[#8B6914] text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

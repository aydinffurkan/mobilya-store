import Link from 'next/link'
import { LayoutDashboard, Package, Tag, ShoppingBag, LogOut } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: Tag },
  { href: '/admin/siparisler', label: 'Siparişler', icon: ShoppingBag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8f7f5]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1a1a1a] text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <Link href="/" className="text-lg font-bold text-[#c9a84c]">
            MOBİLYA<span className="text-white">STORE</span>
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Admin Paneli</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link
            href="/auth/giris"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Çıkış Yap
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}

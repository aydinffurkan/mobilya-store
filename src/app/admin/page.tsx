import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingBag, Tag, TrendingUp } from 'lucide-react'

async function getStats() {
  try {
    const supabase = await createClient()
    const [{ count: products }, { count: orders }, { count: categories }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ])
    return { products: products ?? 0, orders: orders ?? 0, categories: categories ?? 0 }
  } catch {
    return { products: 0, orders: 0, categories: 0 }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Toplam Ürün', value: stats.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Kategori', value: stats.categories, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Sipariş', value: stats.orders, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Bu Ay Gelir', value: '—', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Mağazanızın genel durumu</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="font-bold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/urunler/yeni', label: '+ Ürün Ekle', color: 'bg-[#8B6914] text-white hover:bg-[#7a5c12]' },
            { href: '/admin/kategoriler/yeni', label: '+ Kategori Ekle', color: 'bg-blue-600 text-white hover:bg-blue-700' },
            { href: '/admin/siparisler', label: 'Siparişleri Gör', color: 'bg-secondary hover:bg-secondary/80' },
            { href: '/', label: 'Siteyi Gör', color: 'bg-secondary hover:bg-secondary/80' },
          ].map(({ href, label, color }) => (
            <a
              key={href}
              href={href}
              className={`${color} text-center py-3 px-4 rounded-xl text-sm font-medium transition-colors`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

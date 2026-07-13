import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Package, ShoppingBag, Tag, TrendingUp, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import RevenueChart from '@/components/admin/RevenueChart'
import TopProductsChart from '@/components/admin/TopProductsChart'

const statusLabel: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

async function getDashboardData() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    const [
      { count: products },
      { count: orders },
      { count: categories },
      { data: monthlyOrders },
      { data: recentOrders },
      { data: lowStockProducts },
      { data: usersData },
      { data: trendOrders },
      { data: orderItems },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total').gte('created_at', startOfMonth).neq('status', 'cancelled'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, slug, stock').lte('stock', 5).eq('is_active', true).order('stock', { ascending: true }).limit(5),
      adminClient.auth.admin.listUsers({ page: 1, perPage: 5 }),
      supabase.from('orders').select('total, created_at').gte('created_at', fourteenDaysAgo.toISOString()).neq('status', 'cancelled'),
      supabase.from('order_items').select('product_id, quantity, unit_price, product:products(id, name), order:orders(status)'),
    ])

    const revenue = monthlyOrders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0

    const recentCustomers = (usersData?.users ?? [])
      .filter((u) => u.app_metadata?.role !== 'admin')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    // Last 14 days revenue trend
    const revenueByDay = new Map<string, number>()
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo)
      d.setDate(d.getDate() + i)
      revenueByDay.set(d.toISOString().slice(0, 10), 0)
    }
    ;(trendOrders ?? []).forEach((o: any) => {
      const key = new Date(o.created_at).toISOString().slice(0, 10)
      if (revenueByDay.has(key)) revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(o.total))
    })
    const revenueTrend = Array.from(revenueByDay.entries()).map(([key, value]) => ({
      label: new Date(key).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      value,
    }))

    // Top selling products by quantity
    const productStats = new Map<string, { id: string; name: string; quantity: number; revenue: number }>()
    ;(orderItems ?? []).forEach((item: any) => {
      const id = item.product_id
      if (!id || item.order?.status === 'cancelled') return
      const name = item.product?.name ?? 'Silinmiş ürün'
      const existing = productStats.get(id) ?? { id, name, quantity: 0, revenue: 0 }
      existing.quantity += item.quantity
      existing.revenue += item.quantity * Number(item.unit_price)
      productStats.set(id, existing)
    })
    const topProducts = Array.from(productStats.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

    return {
      products: products ?? 0,
      orders: orders ?? 0,
      categories: categories ?? 0,
      revenue,
      recentOrders: recentOrders ?? [],
      lowStockProducts: lowStockProducts ?? [],
      recentCustomers,
      revenueTrend,
      topProducts,
    }
  } catch {
    return { products: 0, orders: 0, categories: 0, revenue: 0, recentOrders: [], lowStockProducts: [], recentCustomers: [], revenueTrend: [], topProducts: [] }
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardData()

  const cards = [
    { label: 'Toplam Ürün', value: stats.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Kategori', value: stats.categories, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Sipariş', value: stats.orders, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Bu Ay Gelir', value: `${stats.revenue.toLocaleString('tr-TR')} ₺`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
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
            <p className="text-2xl sm:text-3xl font-bold truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <RevenueChart data={stats.revenueTrend} />
        <TopProductsChart products={stats.topProducts} />
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 mb-8">
        <h2 className="font-bold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/urunler/yeni', label: '+ Ürün Ekle', color: 'bg-[#222222] text-white hover:bg-[#222222]' },
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

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Son Siparişler */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-bold">Son Siparişler</h2>
            <Link href="/admin/siparisler" className="text-xs text-[#222222] hover:underline font-medium">
              Tümünü Gör →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Henüz sipariş yok.</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/siparisler/${order.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{order.shipping_address?.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-[#222222]">{Number(order.total).toLocaleString('tr-TR')} ₺</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Düşük Stok Uyarısı */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="font-bold">Düşük Stok</h2>
            </div>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Düşük stoklu ürün yok.</p>
            ) : (
              <div className="divide-y divide-border">
                {stats.lowStockProducts.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/admin/urunler/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <Badge className={`${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} hover:bg-inherit`}>
                      {p.stock === 0 ? 'Tükendi' : `${p.stock} adet`}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Son Üyeler */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold">Son Üyeler</h2>
              <Link href="/admin/musteriler" className="text-xs text-[#222222] hover:underline font-medium">
                Tümünü Gör →
              </Link>
            </div>
            {stats.recentCustomers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Henüz üye yok.</p>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentCustomers.map((u: any) => (
                  <Link
                    key={u.id}
                    href={`/admin/musteriler/${u.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{u.user_metadata?.full_name ?? u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

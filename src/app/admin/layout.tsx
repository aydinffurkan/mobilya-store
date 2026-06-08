import Link from 'next/link'
import { LogOut } from 'lucide-react'
import AdminNav from '@/components/admin/AdminNav'
import AdminMobileSidebar from '@/components/admin/AdminMobileSidebar'
import NotificationBell from '@/components/admin/NotificationBell'
import { createAdminClient } from '@/lib/supabase/admin'

async function getActivityData() {
  try {
    const adminClient = createAdminClient()

    const [
      { count: pendingOrderCount },
      { data: recentOrders },
      { data: lowStockProducts },
      { data: usersData },
    ] = await Promise.all([
      adminClient.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      adminClient.from('orders').select('id, status, created_at, shipping_address, total').order('created_at', { ascending: false }).limit(5),
      adminClient.from('products').select('id, name, stock').lte('stock', 5).eq('is_active', true).order('stock', { ascending: true }).limit(3),
      adminClient.auth.admin.listUsers({ page: 1, perPage: 5 }),
    ])

    const recentCustomers = (usersData?.users ?? [])
      .filter((u) => u.app_metadata?.role !== 'admin')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)

    const activities = [
      ...(recentOrders ?? []).map((o: any) => ({
        id: `order-${o.id}`,
        type: 'order' as const,
        title: `Yeni sipariş — ${o.shipping_address?.full_name ?? 'Müşteri'}`,
        subtitle: `${Number(o.total).toLocaleString('tr-TR')} ₺ · #${o.id.slice(0, 8).toUpperCase()}`,
        href: `/admin/siparisler/${o.id}`,
        date: o.created_at,
      })),
      ...(lowStockProducts ?? []).map((p: any) => ({
        id: `stock-${p.id}`,
        type: 'low_stock' as const,
        title: `Düşük stok — ${p.name}`,
        subtitle: p.stock === 0 ? 'Stok tükendi' : `${p.stock} adet kaldı`,
        href: `/admin/urunler/${p.id}`,
        date: new Date().toISOString(),
      })),
      ...recentCustomers.map((u: any) => ({
        id: `customer-${u.id}`,
        type: 'customer' as const,
        title: `Yeni üye — ${u.user_metadata?.full_name ?? u.email}`,
        subtitle: u.email,
        href: `/admin/musteriler/${u.id}`,
        date: u.created_at,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

    return { pendingOrderCount: pendingOrderCount ?? 0, activities }
  } catch {
    return { pendingOrderCount: 0, activities: [] }
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pendingOrderCount, activities } = await getActivityData()

  return (
    <div className="flex min-h-screen bg-[#f8f7f5]">
      {/* Sidebar (desktop only) */}
      <aside className="hidden md:flex w-60 bg-[#1a1a1a] text-white flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <Link href="/" className="text-lg font-bold text-[#c9a84c]">
            MOBİLYA<span className="text-white">STORE</span>
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Admin Paneli</p>
        </div>
        <AdminNav />
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
      <main className="flex-1 overflow-auto min-w-0">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <AdminMobileSidebar />
            <Link href="/" className="md:hidden text-sm font-bold text-[#8B6914]">
              MOBİLYA<span className="text-foreground">STORE</span>
            </Link>
          </div>
          <NotificationBell pendingOrderCount={pendingOrderCount} activities={activities} />
        </div>
        <div className="max-w-6xl mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}

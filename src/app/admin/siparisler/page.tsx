import { createAdminClient } from '@/lib/supabase/admin'
import OrdersTable from '@/components/admin/OrdersTable'
import { ShoppingCart, Clock, Truck, TrendingUp } from 'lucide-react'

async function getOrders() {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  const pending   = orders.filter((o) => o.status === 'pending').length
  const shipped   = orders.filter((o) => o.status === 'shipped').length
  const revenue   = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0)

  const stats = [
    { label: 'Toplam Sipariş', value: orders.length, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Beklemede',      value: pending,        icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Kargoda',        value: shipped,        icon: Truck,         color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Toplam Ciro',    value: revenue.toLocaleString('tr-TR') + ' ₺', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} sipariş</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
import { createAdminClient } from '@/lib/supabase/admin'
import CustomersTable from '@/components/admin/CustomersTable'
import { Users, ShoppingCart, TrendingUp, Crown } from 'lucide-react'

export default async function AdminCustomersPage() {
  const adminClient = createAdminClient()

  const [{ data: { users } }, { data: orders }, { data: profiles }] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    adminClient.from('orders').select('user_id, total, status').not('user_id', 'is', null),
    adminClient.from('profiles').select('*'),
  ])

  const customerStats = users.map((user) => {
    const userOrders = orders?.filter((o) => o.user_id === user.id) ?? []
    const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const profile    = profiles?.find((p) => p.id === user.id)
    return { user, profile, orderCount: userOrders.length, totalSpent }
  }).filter((c) => !c.user.app_metadata?.role)

  const totalRevenue  = customerStats.reduce((s, c) => s + c.totalSpent, 0)
  const withOrders    = customerStats.filter((c) => c.orderCount > 0).length
  const topSpender    = customerStats.reduce((best, c) => c.totalSpent > (best?.totalSpent ?? 0) ? c : best, customerStats[0])

  const stats = [
    { label: 'Toplam Üye',        value: customerStats.length,              icon: Users,       color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Sipariş Veren',     value: withOrders,                        icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50'  },
    { label: 'Toplam Ciro',       value: totalRevenue.toLocaleString('tr-TR') + ' ₺', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En Çok Harcayan',   value: topSpender?.profile?.full_name ?? topSpender?.user.email?.split('@')[0] ?? '—', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Müşteriler</h1>
        <p className="text-muted-foreground text-sm mt-1">{customerStats.length} üye</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-none truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <CustomersTable customers={customerStats} />
    </div>
  )
}
import { createAdminClient } from '@/lib/supabase/admin'
import CustomersTable from '@/components/admin/CustomersTable'

export default async function AdminCustomersPage() {
  const adminClient = createAdminClient()

  const { data: { users } } = await adminClient.auth.admin.listUsers()

  const { data: orders } = await adminClient
    .from('orders')
    .select('user_id, total, status')
    .not('user_id', 'is', null)

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('*')

  const customerStats = users.map((user) => {
    const userOrders = orders?.filter((o) => o.user_id === user.id) ?? []
    const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const profile = profiles?.find((p) => p.id === user.id)
    return { user, profile, orderCount: userOrders.length, totalSpent }
  }).filter(c => !c.user.app_metadata?.role)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Müşteriler</h1>
        <p className="text-muted-foreground text-sm mt-1">{customerStats.length} üye</p>
      </div>

      <CustomersTable customers={customerStats} />
    </div>
  )
}

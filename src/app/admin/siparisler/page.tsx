import { createClient } from '@/lib/supabase/server'
import OrdersTable from '@/components/admin/OrdersTable'

async function getOrders() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} sipariş</p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}

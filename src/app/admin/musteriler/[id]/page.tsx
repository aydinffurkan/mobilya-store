import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const statusLabel: Record<string, string> = {
  pending: 'Beklemede', confirmed: 'Onaylandı', shipped: 'Kargoda',
  delivered: 'Teslim Edildi', cancelled: 'İptal',
}
const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminClient = createAdminClient()
  const supabase = await createClient()

  const [{ data: { user } }, { data: profile }, { data: orders }, { data: views }] = await Promise.all([
    adminClient.auth.admin.getUserById(id),
    adminClient.from('profiles').select('*').eq('id', id).single(),
    adminClient.from('orders').select('*, order_items(*, product:products(name, images))').eq('user_id', id).order('created_at', { ascending: false }),
    adminClient.from('product_views').select('*, product:products(id, name, images, price)').eq('user_id', id).order('viewed_at', { ascending: false }).limit(20),
  ])

  if (!user) notFound()

  const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/musteriler" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{profile?.full_name || user.email}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Toplam Sipariş', value: orders?.length ?? 0 },
          { label: 'Toplam Harcama', value: `${totalSpent.toLocaleString('tr-TR')} ₺` },
          { label: 'Üyelik Tarihi', value: new Date(user.created_at).toLocaleDateString('tr-TR') },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div>
          <h2 className="font-semibold mb-3">Siparişler</h2>
          <div className="space-y-3">
            {!orders?.length ? (
              <div className="bg-white border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">Sipariş yok</div>
            ) : orders.map((order: any) => (
              <div key={order.id} className="bg-white border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? ''}`}>
                      {statusLabel[order.status]}
                    </span>
                    <span className="font-bold text-[#8B6914] text-sm">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                <div className="mt-2 space-y-1">
                  {order.order_items?.map((item: any) => (
                    <p key={item.id} className="text-xs text-muted-foreground">• {item.product?.name} × {item.quantity}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Viewed products */}
        <div>
          <h2 className="font-semibold mb-3">Görüntülenen Ürünler</h2>
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            {!views?.length ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Görüntülenen ürün yok</div>
            ) : (
              <div className="divide-y divide-border">
                {views.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {v.product?.images?.[0] && <img src={v.product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(v.viewed_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#8B6914] flex-shrink-0">
                      {Number(v.product?.price).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import LogoutButton from '@/components/account/LogoutButton'

const statusLabel: Record<string, string> = {
  pending: 'Beklemede', confirmed: 'Onaylandı', shipped: 'Kargoda',
  delivered: 'Teslim Edildi', cancelled: 'İptal',
}
const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/giris')

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*, order_items(*, product:products(name, images))').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Hesabım</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white border border-border rounded-2xl p-5 h-fit space-y-3">
          <h2 className="font-semibold">Profil Bilgileri</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Ad Soyad</p>
              <p className="font-medium">{profile?.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">E-posta</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="font-medium">{profile?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Üyelik Tarihi</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold">Siparişlerim ({orders?.length ?? 0})</h2>
          {!orders || orders.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground">
              <p>Henüz sipariş vermediniz.</p>
              <Link href="/urunler" className="text-[#8B6914] hover:underline text-sm mt-2 block">Alışverişe başla →</Link>
            </div>
          ) : (
            orders.map((order: any) => (
              <div key={order.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] ?? ''}`}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                    <span className="font-bold text-[#8B6914]">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                        {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-muted-foreground">{item.product?.name} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

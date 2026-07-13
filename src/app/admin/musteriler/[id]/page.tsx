import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, ShoppingCart, TrendingUp, Eye, Package, ExternalLink, Tag } from 'lucide-react'
import CustomerNoteForm from '@/components/admin/CustomerNoteForm'

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

  const [
    { data: { user } },
    { data: profile },
    { data: orders },
    { data: views },
  ] = await Promise.all([
    adminClient.auth.admin.getUserById(id),
    adminClient.from('profiles').select('*').eq('id', id).single(),
    adminClient.from('orders').select('*, order_items(*, product:products(name, images))').eq('user_id', id).order('created_at', { ascending: false }),
    adminClient.from('product_views').select('*, product:products(id, name, images, price)').eq('user_id', id).order('viewed_at', { ascending: false }).limit(20),
  ])

  if (!user) notFound()

  const totalSpent  = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0
  const delivered   = orders?.filter((o) => o.status === 'delivered').length ?? 0
  const displayName = profile?.full_name || user.email?.split('@')[0] || '—'
  const adminTag    = (profile as any)?.admin_tag as string | null | undefined

  const stats = [
    { label: 'Toplam Sipariş',    value: orders?.length ?? 0,                      icon: ShoppingCart, color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Toplam Harcama',    value: totalSpent.toLocaleString('tr-TR') + ' ₺', icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Teslim Edilen',     value: delivered,                                 icon: Package,     color: 'text-purple-600',  bg: 'bg-purple-50'  },
    { label: 'Ürün Görüntüleme',  value: views?.length ?? 0,                        icon: Eye,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link href="/admin/musteriler" className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#222222]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-[#222222]">{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              {adminTag && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  adminTag === 'vip'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  adminTag === 'aktif'   ? 'bg-green-100 text-green-700 border-green-200' :
                  adminTag === 'inaktif' ? 'bg-gray-100 text-gray-500 border-gray-200'   :
                  adminTag === 'riskli'  ? 'bg-red-100 text-red-600 border-red-200'       : ''
                }`}>
                  {adminTag.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Orders */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Siparişler</h2>
          {!orders?.length ? (
            <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
              Henüz sipariş yok
            </div>
          ) : orders.map((order: any) => (
            <div key={order.id} className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <Link
                    href={`/admin/siparisler/${order.id}`}
                    className="font-mono text-xs text-[#222222] hover:underline font-medium"
                  >
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? ''}`}>
                    {statusLabel[order.status] ?? order.status}
                  </span>
                  <span className="font-bold text-[#222222] text-sm">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="border-t border-border px-5 py-3 flex flex-wrap gap-3">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                      {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{item.product?.name} ×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Customer info */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-4">Müşteri Bilgileri</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail size={13} className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone size={13} className="text-muted-foreground flex-shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Calendar size={13} className="flex-shrink-0" />
                <span>Üyelik: {new Date(user.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-secondary/60 transition-colors"
              >
                <Mail size={13} className="text-[#222222]" />
                E-posta Gönder
                <ExternalLink size={11} className="text-muted-foreground ml-auto" />
              </a>
              <Link
                href={`/admin/siparisler?user=${user.id}`}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-secondary/60 transition-colors"
              >
                <ShoppingCart size={13} className="text-[#222222]" />
                Siparişleri Gör
                <ExternalLink size={11} className="text-muted-foreground ml-auto" />
              </Link>
            </div>
          </div>

          {/* Admin note + tag */}
          <CustomerNoteForm
            customerId={id}
            initialNote={(profile as any)?.admin_note}
            initialTag={adminTag}
          />

          {/* Recently viewed */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Son Gezilen Ürünler</h2>
            </div>
            {!views?.length ? (
              <div className="px-5 py-6 text-center text-muted-foreground text-sm">Görüntülenen ürün yok</div>
            ) : (
              <div className="divide-y divide-border">
                {views.slice(0, 8).map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                      {v.product?.images?.[0] && <img src={v.product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{v.product?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(v.viewed_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-[#222222] flex-shrink-0">
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
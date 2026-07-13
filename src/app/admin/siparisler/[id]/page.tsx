import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { JSX } from 'react'
import { ArrowLeft, MapPin, Phone, Mail, Package, CreditCard, Home, Landmark } from 'lucide-react'
import OrderStatusSelect from '@/components/admin/OrderStatusSelect'
import OrderTimeline     from '@/components/admin/OrderTimeline'
import OrderCargoForm    from '@/components/admin/OrderCargoForm'
import OrderNoteForm     from '@/components/admin/OrderNoteForm'
import PrintButton       from '@/components/admin/PrintButton'

const statusLabel: Record<string, string> = {
  pending:          'Beklemede',
  pending_payment:  'Ödeme Bekleniyor',
  pending_transfer: 'Havale Bekleniyor',
  confirmed:        'Onaylandı',
  shipped:          'Kargoda',
  delivered:        'Teslim Edildi',
  cancelled:        'İptal',
  payment_failed:   'Ödeme Başarısız',
}

const statusColor: Record<string, string> = {
  pending:          'bg-amber-100 text-amber-700',
  pending_payment:  'bg-orange-100 text-orange-700',
  pending_transfer: 'bg-violet-100 text-violet-700',
  confirmed:        'bg-blue-100 text-blue-700',
  shipped:          'bg-purple-100 text-purple-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
  payment_failed:   'bg-red-100 text-red-700',
}

const paymentMethodLabel: Record<string, string> = {
  card:     'Kredi / Banka Kartı',
  cod:      'Kapıda Ödeme',
  transfer: 'Havale / EFT',
}

const paymentMethodIcon: Record<string, JSX.Element> = {
  card:     <CreditCard size={12} />,
  cod:      <Home size={12} />,
  transfer: <Landmark size={12} />,
}

async function getOrder(id: string) {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('orders')
      .select('*, order_items(*, product:products(name, slug, images))')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  const addr = order.shipping_address ?? {}
  const shortId = order.id.slice(0, 8).toUpperCase()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link href="/admin/siparisler" className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Sipariş #{shortId}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {new Date(order.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
          <PrintButton />
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white border border-border rounded-2xl px-6 py-5 mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sipariş Durumu</p>
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Sol: Ürünler ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Sipariş kalemleri */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Package size={15} className="text-muted-foreground" />
              <h2 className="font-semibold text-sm">Sipariş Kalemleri</h2>
            </div>
            <div className="divide-y divide-border">
              {(order.order_items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border">
                    {item.product?.images?.[0]
                      ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug line-clamp-2">
                      {item.product?.name ?? 'Ürün silinmiş'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} adet × {Number(item.unit_price).toLocaleString('tr-TR')} ₺
                    </p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                    )}
                  </div>
                  <p className="font-semibold text-[#222222] flex-shrink-0">
                    {(item.quantity * Number(item.unit_price)).toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-border bg-neutral-50/50 flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Toplam</span>
              <span className="font-bold text-[#222222] text-lg">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>

          {/* Kargo bilgileri */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-4">Kargo Bilgileri</h2>
            <OrderCargoForm
              orderId={order.id}
              initialCarrier={order.carrier ?? null}
              initialTracking={order.tracking_number ?? null}
            />
          </div>

          {/* Dahili not */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Dahili Not</h2>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Müşteriye gösterilmez</span>
            </div>
            <OrderNoteForm orderId={order.id} initialNote={order.admin_note ?? null} />
          </div>
        </div>

        {/* ── Sağ: Müşteri ── */}
        <div className="space-y-5">

          {/* Müşteri bilgileri */}
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm">Müşteri Bilgileri</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {(addr.full_name ?? '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{addr.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{addr.email ?? ''}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                {addr.phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone size={12} className="text-muted-foreground flex-shrink-0" />
                    <span>{addr.phone}</span>
                  </div>
                )}
                {addr.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{addr.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs">
                  <MapPin size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{addr.address}</p>
                    <p className="text-muted-foreground">{addr.district}, {addr.city} {addr.zip_code}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sipariş özeti */}
          <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Sipariş Özeti</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sipariş No</span>
                <span className="font-mono font-semibold">#{shortId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarih</span>
                <span>{new Date(order.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Durum</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
              {order.payment_method && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ödeme Yöntemi</span>
                  <span className="flex items-center gap-1 text-sm">
                    {paymentMethodIcon[order.payment_method]}
                    {paymentMethodLabel[order.payment_method] ?? order.payment_method}
                  </span>
                </div>
              )}
              {order.carrier && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kargo Firması</span>
                  <span>{order.carrier}</span>
                </div>
              )}
              {order.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Takip No</span>
                  <span className="font-mono text-xs">{order.tracking_number}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-semibold">
                <span>Toplam</span>
                <span className="text-[#222222]">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
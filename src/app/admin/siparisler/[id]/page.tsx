import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import OrderStatusSelect from '@/components/admin/OrderStatusSelect'

async function getOrder(id: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(name, images))')
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

  const addr = order.shipping_address

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/siparisler" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Sipariş #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Sipariş Kalemleri</h2>
          </div>
          <div className="divide-y divide-border">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product?.name ?? 'Ürün silinmiş'}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} adet × {Number(item.unit_price).toLocaleString('tr-TR')} ₺</p>
                </div>
                <p className="font-semibold text-[#8B6914] flex-shrink-0">
                  {(item.quantity * item.unit_price).toLocaleString('tr-TR')} ₺
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-border flex justify-between">
            <span className="font-semibold">Toplam</span>
            <span className="font-bold text-[#8B6914] text-lg">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="font-semibold">Müşteri Bilgileri</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Ad Soyad</p>
              <p className="font-medium">{addr?.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="font-medium">{addr?.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">E-posta</p>
              <p className="font-medium">{addr?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teslimat Adresi</p>
              <p className="font-medium">{addr?.address}</p>
              <p className="text-muted-foreground">{addr?.district}, {addr?.city} {addr?.zip_code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

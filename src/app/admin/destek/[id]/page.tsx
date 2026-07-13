import { getAdminTicket } from '@/lib/actions/support'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wrench, RotateCcw, User, ShoppingBag } from 'lucide-react'
import TicketStatusForm from '@/components/admin/TicketStatusForm'

const STATUS_LABEL: Record<string, string> = {
  beklemede: 'Beklemede', inceleniyor: 'İnceleniyor',
  cozuldu: 'Çözüldü', reddedildi: 'Reddedildi',
}
const STATUS_COLOR: Record<string, string> = {
  beklemede:   'bg-amber-100 text-amber-700',
  inceleniyor: 'bg-blue-100 text-blue-700',
  cozuldu:     'bg-green-100 text-green-700',
  reddedildi:  'bg-red-100 text-red-700',
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ticket = await getAdminTicket(id)
  if (!ticket) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/destek" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            ticket.type === 'iade' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {ticket.type === 'iade' ? <RotateCcw size={11} /> : <Wrench size={11} />}
            {ticket.type === 'iade' ? 'İade Talebi' : 'Arıza Bildirimi'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[ticket.status] ?? ''}`}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Sol: Talep detayı */}
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">Talep Açıklaması</h2>
            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.images && ticket.images.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-3">Yüklenen Fotoğraflar</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ticket.images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden border border-border hover:opacity-80 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <TicketStatusForm
            ticketId={ticket.id}
            currentStatus={ticket.status}
            currentNote={ticket.admin_note ?? ''}
          />
        </div>

        {/* Sağ: Bilgiler */}
        <div className="space-y-5">

          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm">Müşteri Bilgileri</h2>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-muted-foreground" />
              </div>
              <div>
                {ticket.shipping_name && <p className="text-sm font-medium">{ticket.shipping_name}</p>}
                <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
              </div>
            </div>
          </div>

          {ticket.order_id && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-3">İlgili Sipariş</h2>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold">#{ticket.order_id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <Link
                href={`/admin/siparisler/${ticket.order_id}`}
                className="mt-3 block text-xs font-medium text-[#222222] hover:underline"
              >
                Siparişi görüntüle →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

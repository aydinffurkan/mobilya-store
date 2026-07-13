import { Resend } from 'resend'
import { createAdminClient } from './supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM        = process.env.RESEND_FROM_EMAIL  ?? 'noreply@example.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL        ?? ''
const SITE_NAME   = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Mobilya Mağazası'
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL  ?? ''

// ─── Durum etiketleri ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  paid:      'Ödeme Alındı',
  confirmed: 'Onaylandı',
  shipped:   'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
}

const STATUS_MSG: Record<string, string> = {
  paid:      'Siparişiniz alındı, en kısa sürede hazırlanacak.',
  confirmed: 'Siparişiniz onaylandı ve hazırlık sürecine alındı.',
  shipped:   'Siparişiniz kargoya verildi. Kargo takip bilgileriniz aşağıdadır.',
  delivered: 'Siparişiniz teslim edildi. İyi günlerde kullanmanızı dileriz!',
  cancelled: 'Siparişiniz iptal edildi. Sorularınız için bize ulaşabilirsiniz.',
}

// ─── DB ──────────────────────────────────────────────────────────────────────

async function getOrder(orderId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('*, order_items(*, product:products(name, images))')
    .eq('id', orderId)
    .single()
  return data
}

// ─── HTML yardımcıları ───────────────────────────────────────────────────────

function baseLayout(title: string, body: string) {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f4f2;padding:40px 16px">
  <tr><td align="center">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;width:100%">

      <!-- Logo -->
      <tr>
        <td style="background:#222222;padding:22px 32px;border-radius:16px 16px 0 0;text-align:center">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:3px;text-transform:uppercase">${SITE_NAME}</span>
        </td>
      </tr>

      <!-- Gövde -->
      <tr>
        <td style="background:#ffffff;padding:36px 32px">
          ${body}
        </td>
      </tr>

      <!-- Alt bilgi -->
      <tr>
        <td style="background:#f9f8f6;padding:20px 32px;border-radius:0 0 16px 16px;text-align:center">
          <p style="margin:0 0 4px;color:#999999;font-size:12px">© ${year} ${SITE_NAME}. Tüm hakları saklıdır.</p>
          ${SITE_URL ? `<a href="${SITE_URL}" style="color:#bbbbbb;font-size:11px;text-decoration:none">${SITE_URL.replace(/^https?:\/\//, '')}</a>` : ''}
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function orderItemsTable(orderItems: any[]): string {
  if (!orderItems?.length) return ''
  const rows = orderItems.map((item: any) => {
    const name     = item.product?.name ?? 'Ürün'
    const qty      = item.quantity ?? 1
    const price    = Number(item.unit_price ?? 0)
    const subtotal = (qty * price).toLocaleString('tr-TR')
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333">${name}${item.variant_name ? ` <span style="color:#999999;font-size:12px">(${item.variant_name})</span>` : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666666;text-align:center;white-space:nowrap">${qty} adet</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#222222;font-weight:600;text-align:right;white-space:nowrap">${subtotal} ₺</td>
    </tr>`
  }).join('')

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top:1px solid #f0f0f0">
    <thead>
      <tr>
        <th style="padding:10px 0 8px;font-size:11px;font-weight:600;color:#999999;text-align:left;text-transform:uppercase;letter-spacing:1px">Ürün</th>
        <th style="padding:10px 8px 8px;font-size:11px;font-weight:600;color:#999999;text-align:center;text-transform:uppercase;letter-spacing:1px">Adet</th>
        <th style="padding:10px 0 8px;font-size:11px;font-weight:600;color:#999999;text-align:right;text-transform:uppercase;letter-spacing:1px">Tutar</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function badge(status: string): string {
  const colors: Record<string, string> = {
    paid:      'background:#dcfce7;color:#166534',
    confirmed: 'background:#dbeafe;color:#1e40af',
    shipped:   'background:#ede9fe;color:#5b21b6',
    delivered: 'background:#d1fae5;color:#065f46',
    cancelled: 'background:#fee2e2;color:#991b1b',
  }
  const style = colors[status] ?? 'background:#f3f4f6;color:#374151'
  return `<span style="${style};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">${STATUS_LABEL[status] ?? status}</span>`
}

// ─── Şablonlar ───────────────────────────────────────────────────────────────

function orderConfirmationHtml(order: any): string {
  const addr     = (order.shipping_address ?? {}) as Record<string, string>
  const shortId  = (order.id as string).slice(0, 8).toUpperCase()
  const fullName = addr.full_name ?? 'Değerli Müşterimiz'
  const total    = Number(order.total).toLocaleString('tr-TR')
  const date     = new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const trackUrl = `${SITE_URL}/siparis-takip`

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#333333">Merhaba <strong>${fullName}</strong>,</p>
    <p style="margin:0 0 28px;font-size:15px;color:#555555">Siparişinizi aldık! En kısa sürede hazırlayıp kargoya vereceğiz.</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9f8f6;border-radius:12px;padding:20px;margin-bottom:28px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Sipariş Numarası</p>
          <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#222222;font-family:monospace">#${shortId}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Tarih</p>
          <p style="margin:0 0 16px;font-size:14px;color:#444444">${date}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Durum</p>
          <p style="margin:0">${badge('paid')}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#333333;text-transform:uppercase;letter-spacing:1px">Sipariş İçeriği</p>
    ${orderItemsTable(order.order_items ?? [])}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:8px">
      <tr>
        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#222222">Toplam</td>
        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#222222;text-align:right">${total} ₺</td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;background:#f9f8f6;border-radius:12px;padding:20px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Teslimat Adresi</p>
          <p style="margin:0;font-size:14px;color:#444444;line-height:1.6">
            ${addr.full_name ?? ''}<br>
            ${addr.address ?? ''}<br>
            ${addr.district ?? ''}, ${addr.city ?? ''}${addr.zip_code ? ' ' + addr.zip_code : ''}<br>
            ${addr.phone ?? ''}
          </p>
        </td>
      </tr>
    </table>

    ${trackUrl ? `<div style="text-align:center;margin-top:28px">
      <a href="${trackUrl}" style="display:inline-block;background:#222222;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">Siparişimi Takip Et</a>
    </div>` : ''}
  `

  return baseLayout(`Sipariş Onayı — #${shortId}`, body)
}

function statusUpdateHtml(order: any, status: string): string {
  const addr     = (order.shipping_address ?? {}) as Record<string, string>
  const shortId  = (order.id as string).slice(0, 8).toUpperCase()
  const fullName = addr.full_name ?? 'Değerli Müşterimiz'
  const message  = STATUS_MSG[status] ?? 'Siparişinizin durumu güncellendi.'
  const trackUrl = `${SITE_URL}/siparis-takip`

  let cargoSection = ''
  if (status === 'shipped' && order.carrier && order.tracking_number) {
    cargoSection = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f0ff;border-radius:12px;padding:20px;margin-top:20px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;font-weight:600">Kargo Bilgisi</p>
          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#222222">${order.carrier}</p>
          <p style="margin:0;font-family:monospace;font-size:14px;color:#444444">${order.tracking_number}</p>
        </td>
      </tr>
    </table>`
  }

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#333333">Merhaba <strong>${fullName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555555">${message}</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9f8f6;border-radius:12px;padding:20px;margin-bottom:20px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Sipariş Numarası</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#222222;font-family:monospace">#${shortId}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Güncel Durum</p>
          <p style="margin:0">${badge(status)}</p>
        </td>
      </tr>
    </table>

    ${cargoSection}

    ${trackUrl ? `<div style="text-align:center;margin-top:28px">
      <a href="${trackUrl}" style="display:inline-block;background:#222222;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">Siparişimi Takip Et</a>
    </div>` : ''}
  `

  return baseLayout(`Sipariş Durumu: ${STATUS_LABEL[status] ?? status} — #${shortId}`, body)
}

function adminNotificationHtml(order: any): string {
  const addr    = (order.shipping_address ?? {}) as Record<string, string>
  const shortId = (order.id as string).slice(0, 8).toUpperCase()
  const total   = Number(order.total).toLocaleString('tr-TR')
  const date    = new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const adminUrl = `${SITE_URL}/admin/siparisler/${order.id}`

  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#333333">Yeni bir sipariş alındı!</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9f8f6;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Sipariş No</p>
          <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#222222;font-family:monospace">#${shortId}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Müşteri</p>
          <p style="margin:0 0 4px;font-size:14px;color:#444444">${addr.full_name ?? '—'}</p>
          <p style="margin:0 0 16px;font-size:14px;color:#666666">${addr.email ?? ''} · ${addr.phone ?? ''}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Tarih</p>
          <p style="margin:0 0 16px;font-size:14px;color:#444444">${date}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Toplam</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#222222">${total} ₺</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#333333;text-transform:uppercase;letter-spacing:1px">Ürünler</p>
    ${orderItemsTable(order.order_items ?? [])}

    ${adminUrl ? `<div style="text-align:center;margin-top:28px">
      <a href="${adminUrl}" style="display:inline-block;background:#222222;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">Admin Panelinde Görüntüle</a>
    </div>` : ''}
  `

  return baseLayout(`Yeni Sipariş — #${shortId} — ${total} ₺`, body)
}

// ─── Destek talebi şablonu ───────────────────────────────────────────────────

const TICKET_STATUS_LABEL: Record<string, string> = {
  beklemede:   'Beklemede',
  inceleniyor: 'İnceleniyor',
  cozuldu:     'Çözüldü',
  reddedildi:  'Reddedildi',
}

const TICKET_STATUS_COLOR: Record<string, string> = {
  beklemede:   'background:#fef9c3;color:#854d0e',
  inceleniyor: 'background:#dbeafe;color:#1e40af',
  cozuldu:     'background:#dcfce7;color:#166534',
  reddedildi:  'background:#fee2e2;color:#991b1b',
}

const TICKET_TYPE_LABEL: Record<string, string> = {
  iade:  'İade Talebi',
  ariza: 'Arıza Bildirimi',
}

function ticketBadge(status: string): string {
  const style = TICKET_STATUS_COLOR[status] ?? 'background:#f3f4f6;color:#374151'
  return `<span style="${style};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">${TICKET_STATUS_LABEL[status] ?? status}</span>`
}

function ticketStatusHtml(ticket: {
  id: string; subject: string; type: string; status: string; admin_note?: string | null
}, userEmail: string): string {
  const shortId = ticket.id.slice(0, 8).toUpperCase()
  const typeLabel   = TICKET_TYPE_LABEL[ticket.type] ?? ticket.type
  const statusLabel = TICKET_STATUS_LABEL[ticket.status] ?? ticket.status
  const accountUrl  = `${SITE_URL}/hesabim`

  const statusMessages: Record<string, string> = {
    beklemede:   'Talebiniz alınmıştır, en kısa sürede incelenecektir.',
    inceleniyor: 'Talebiniz incelemeye alınmıştır.',
    cozuldu:     'Talebiniz çözüme kavuşturulmuştur.',
    reddedildi:  'Talebiniz değerlendirilerek reddedilmiştir.',
  }

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#333333">Merhaba,</p>
    <p style="margin:0 0 28px;font-size:15px;color:#555555">${statusMessages[ticket.status] ?? 'Destek talebinizin durumu güncellendi.'}</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9f8f6;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Talep No</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#222222;font-family:monospace">#${shortId}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Konu</p>
          <p style="margin:0 0 16px;font-size:14px;color:#444444">${ticket.subject}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Talep Tipi</p>
          <p style="margin:0 0 16px;font-size:14px;color:#444444">${typeLabel}</p>
          <p style="margin:0 0 4px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:1px">Güncel Durum</p>
          <p style="margin:0">${ticketBadge(ticket.status)}</p>
        </td>
      </tr>
    </table>

    ${ticket.admin_note ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f0f9ff;border-left:3px solid #0284c7;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:600">Yetkili Notu</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${ticket.admin_note}</p>
        </td>
      </tr>
    </table>` : ''}

    ${accountUrl ? `<div style="text-align:center;margin-top:28px">
      <a href="${accountUrl}" style="display:inline-block;background:#222222;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">Hesabımı Görüntüle</a>
    </div>` : ''}
  `

  return baseLayout(`Destek Talebi Güncellendi — #${shortId} — ${statusLabel}`, body)
}

// ─── Dışa aktarılan fonksiyonlar ─────────────────────────────────────────────

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) return
  const email = (order.shipping_address as Record<string, string>)?.email
  if (!email) return

  await resend.emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: [email],
    subject: `Siparişiniz Alındı — #${(orderId).slice(0, 8).toUpperCase()}`,
    html: orderConfirmationHtml(order),
  })
}

export async function sendStatusUpdate(orderId: string, status: string): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) return
  const email = (order.shipping_address as Record<string, string>)?.email
  if (!email) return

  await resend.emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: [email],
    subject: `Sipariş Durumu: ${STATUS_LABEL[status] ?? status} — #${(orderId).slice(0, 8).toUpperCase()}`,
    html: statusUpdateHtml(order, status),
  })
}

export async function sendAdminNewOrderNotification(orderId: string): Promise<void> {
  if (!ADMIN_EMAIL) return
  const order = await getOrder(orderId)
  if (!order) return

  await resend.emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: [ADMIN_EMAIL],
    subject: `🆕 Yeni Sipariş — #${(orderId).slice(0, 8).toUpperCase()} — ${Number(order.total).toLocaleString('tr-TR')} ₺`,
    html: adminNotificationHtml(order),
  })
}

export async function sendTicketStatusUpdate(
  ticket: { id: string; subject: string; type: string; status: string; admin_note?: string | null },
  userEmail: string,
): Promise<void> {
  if (!userEmail) return
  const shortId     = ticket.id.slice(0, 8).toUpperCase()
  const statusLabel = TICKET_STATUS_LABEL[ticket.status] ?? ticket.status

  await resend.emails.send({
    from: `${SITE_NAME} <${FROM}>`,
    to: [userEmail],
    subject: `Destek Talebi Güncellendi — #${shortId} — ${statusLabel}`,
    html: ticketStatusHtml(ticket, userEmail),
  })
}

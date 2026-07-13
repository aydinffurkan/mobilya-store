import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQNBPaySettings, getToken, checkPaymentStatus } from '@/lib/qnbpay'
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '@/lib/email'

async function getParams(req: NextRequest): Promise<Record<string, string>> {
  const url = new URL(req.url)
  const params: Record<string, string> = {}
  url.searchParams.forEach((v, k) => { params[k] = v })

  // QNBPay can POST form data to callback
  const ct = req.headers.get('content-type') ?? ''
  if (req.method === 'POST') {
    try {
      if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
        const form = await req.formData()
        form.forEach((v, k) => { params[k] = String(v) })
      } else if (ct.includes('application/json')) {
        const json = await req.json()
        Object.assign(params, json)
      }
    } catch { /* ignore parse errors */ }
  }

  return params
}

async function handleCallback(req: NextRequest) {
  const params = await getParams(req)

  // Callback parametreleri güvenilmez (imzasız, herkes POST'layabilir).
  // Yalnızca hangi siparişin sorgulanacağını belirlemek için invoice_id'yi alıyoruz;
  // ödemenin gerçek durumu QNBPay'in kimlik doğrulamalı checkstatus API'sinden okunuyor.
  const qnbpayStatus = params['qnbpay_status'] ?? params['payment_status']
  const invoiceId   = params['invoice_id']
  const orderNo     = params['order_no'] ?? params['order_id']

  console.log('[QNBPay Callback]', req.method, { invoiceId, qnbpayStatus })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  if (!invoiceId) {
    console.error('[QNBPay] invoice_id yok')
    return NextResponse.redirect(`${siteUrl}/odeme?status=error`)
  }

  const admin = createAdminClient()

  // Sipariş yoksa işlem yapma; zaten 'paid' ise idempotent olarak başarı sayfasına
  // yönlendir (sahte bir başarısız callback ödenmiş siparişi düşüremesin).
  const { data: order } = await admin
    .from('orders')
    .select('status, user_id, total')
    .eq('id', invoiceId)
    .single()

  if (!order) {
    console.error('[QNBPay] Sipariş bulunamadı:', invoiceId)
    return NextResponse.redirect(`${siteUrl}/odeme?status=error`)
  }
  if (order.status === 'paid') {
    return NextResponse.redirect(`${siteUrl}/odeme/basarili?order=${invoiceId}`)
  }

  // Gerçek ödeme durumunu QNBPay'den doğrula — callback param'larına güvenme.
  try {
    const settings = await getQNBPaySettings()
    if (!settings) throw new Error('QNBPay ayarları bulunamadı')

    const { token } = await getToken(settings)
    const { paid, transactionId } = await checkPaymentStatus(settings, token, invoiceId)

    console.log('[QNBPay] checkstatus sonucu:', { paid, transactionId })

    if (paid) {
      const paymentRef = orderNo ?? transactionId ?? null
      // Yalnızca ödeme bekleyen siparişi geçir (idempotent, yarış koşulu güvenli).
      await admin.from('orders').update({
        status: 'paid',
        ...(paymentRef ? { payment_ref: paymentRef } : {}),
        paid_at: new Date().toISOString(),
      }).eq('id', invoiceId).eq('status', 'pending_payment')

      // Hediye çekini kullanılmış işaretle
      void admin.from('gift_vouchers')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('order_id', invoiceId)
        .eq('status', 'active')

      // E-posta bildirimleri — redirect'i bloklamaz
      void Promise.all([
        sendOrderConfirmation(invoiceId),
        sendAdminNewOrderNotification(invoiceId),
      ]).catch((err) => console.error('[Email] Gönderim hatası:', err))

      // MessaPuan — ödeme onaylandığında kazanım
      if (order.user_id) {
        void (async () => {
          try {
            const { getPointsConfig, awardPoints } = await import('@/lib/points')
            const cfg = await getPointsConfig()
            const orderPoints = cfg.order_tl_interval > 0
              ? Math.floor((Number(order.total) / cfg.order_tl_interval) * cfg.order_points)
              : 0
            if (orderPoints > 0) {
              await awardPoints(order.user_id, 'order', orderPoints, invoiceId)
            }
          } catch (err) {
            console.error('[MessaPuan] Kart ödeme puanı verilemedi:', err)
          }
        })()
      }

      return NextResponse.redirect(`${siteUrl}/odeme/basarili?order=${invoiceId}`)
    }

    // checkstatus paid=false — yalnızca bekleyen siparişi başarısız işaretle.
    console.warn('[QNBPay] checkstatus paid=false — sipariş başarısız işaretleniyor')
    await admin.from('orders').update({ status: 'payment_failed' })
      .eq('id', invoiceId).eq('status', 'pending_payment')
    return NextResponse.redirect(`${siteUrl}/odeme/basarisiz?order=${invoiceId}`)
  } catch (err) {
    // Doğrulama yapılamadı — sipariş durumunu DEĞİŞTİRME (ödenmiş olabilir),
    // kullanıcıyı nötr hata sayfasına yönlendir.
    console.error('[QNBPay] Callback doğrulama hatası:', err)
    return NextResponse.redirect(`${siteUrl}/odeme?status=error`)
  }
}

export const GET  = handleCallback
export const POST = handleCallback

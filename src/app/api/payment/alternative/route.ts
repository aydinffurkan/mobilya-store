import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CartItemPayload } from '@/lib/qnbpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { method, shippingData, cartItems, voucherCode } = body as {
      method: 'cod' | 'transfer'
      shippingData: {
        full_name: string; email: string; phone: string
        address: string; city: string; district: string; zip_code: string
      }
      cartItems: CartItemPayload[]
      voucherCode?: string | null
    }

    if (method !== 'cod' && method !== 'transfer') {
      return NextResponse.json({ error: 'Geçersiz ödeme yöntemi' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })

    const admin = createAdminClient()

    // Fiyat doğrulama (XSS/manipülasyon önleme)
    const productIds = [...new Set(cartItems.map(i => i.product_id))]
    const variantIds = cartItems.filter(i => i.variant_id).map(i => i.variant_id!)
    type ConfigEntry = { component_id: string; quantity: number }
    const asConfig = (cfg: unknown): ConfigEntry[] => Array.isArray(cfg) ? (cfg as ConfigEntry[]) : []
    const componentIds = [...new Set(
      cartItems.flatMap(i => asConfig(i.components_config).map(c => c.component_id)).filter(Boolean)
    )]

    const [{ data: dbProducts }, { data: dbVariants }, { data: dbComponents }] = await Promise.all([
      admin.from('products').select('id, price, sale_price').in('id', productIds),
      variantIds.length > 0
        ? admin.from('product_variants').select('id, price, sale_price, product_id').in('id', variantIds)
        : Promise.resolve({ data: [] as { id: string; price: number; sale_price: number | null; product_id: string }[] }),
      componentIds.length > 0
        ? admin.from('product_components').select('id, unit_price, product_id').in('id', componentIds)
        : Promise.resolve({ data: [] as { id: string; unit_price: number; product_id: string }[] }),
    ])

    const productMap   = new Map((dbProducts   ?? []).map(p => [p.id, p]))
    const variantMap   = new Map((dbVariants   ?? []).map(v => [v.id, v]))
    const componentMap = new Map((dbComponents ?? []).map(c => [c.id, c]))

    let verifiedTotal = 0
    const verifiedItems: CartItemPayload[] = []

    for (const item of cartItems) {
      let unitPrice: number

      if (item.variant_id) {
        const v = variantMap.get(item.variant_id)
        if (!v) return NextResponse.json({ error: `Varyant bulunamadı: ${item.variant_id}` }, { status: 400 })
        unitPrice = v.sale_price ?? v.price
      } else if (asConfig(item.components_config).length > 0) {
        let sum = 0
        for (const entry of asConfig(item.components_config)) {
          const comp = componentMap.get(entry.component_id)
          if (!comp) return NextResponse.json({ error: `Parça bulunamadı: ${entry.component_id}` }, { status: 400 })
          sum += comp.unit_price * Math.max(0, Math.floor(Number(entry.quantity)))
        }
        unitPrice = sum
      } else {
        const p = productMap.get(item.product_id)
        if (!p) return NextResponse.json({ error: `Ürün bulunamadı: ${item.product_id}` }, { status: 400 })
        unitPrice = p.sale_price ?? p.price
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity)))
      verifiedTotal += unitPrice * qty
      verifiedItems.push({ ...item, unit_price: unitPrice, quantity: qty })
    }

    // Kapıda ödeme için ek ücret
    if (method === 'cod') {
      const { data: kapiData } = await admin
        .from('site_settings').select('value').eq('key', 'kapi_odeme').single()
      const kapiSettings = kapiData?.value as { enabled: boolean; extra_fee: number } | null
      if (!kapiSettings?.enabled) return NextResponse.json({ error: 'Kapıda ödeme aktif değil' }, { status: 400 })
      verifiedTotal += kapiSettings.extra_fee ?? 0
    }

    if (method === 'transfer') {
      const { data: havaleData } = await admin
        .from('site_settings').select('value').eq('key', 'havale').single()
      const havaleSettings = havaleData?.value as { enabled: boolean } | null
      if (!havaleSettings?.enabled) return NextResponse.json({ error: 'Havale/EFT aktif değil' }, { status: 400 })
    }

    verifiedTotal = Math.round(verifiedTotal * 100) / 100

    // Hediye çeki doğrulama (sunucu tarafında — client'a güvenme)
    let voucherDiscount = 0
    let validatedVoucherId: string | null = null
    if (voucherCode) {
      const now2 = new Date().toISOString()
      const { data: v, error: vErr } = await admin
        .from('gift_vouchers')
        .select('id, amount, status, expires_at, user_id')
        .eq('code', voucherCode.trim().toUpperCase())
        .single()
      if (vErr || !v) return NextResponse.json({ error: 'Hediye çeki bulunamadı' }, { status: 400 })
      if (v.user_id !== user.id) return NextResponse.json({ error: 'Bu hediye çeki size ait değil' }, { status: 400 })
      if (v.status !== 'active') return NextResponse.json({ error: 'Hediye çeki zaten kullanılmış' }, { status: 400 })
      if (v.expires_at < now2) return NextResponse.json({ error: 'Hediye çekinin süresi dolmuş' }, { status: 400 })
      voucherDiscount = Math.min(Math.round(Number(v.amount) * 100) / 100, verifiedTotal)
      validatedVoucherId = v.id as string
    }
    verifiedTotal = Math.max(0, Math.round((verifiedTotal - voucherDiscount) * 100) / 100)

    const orderStatus = method === 'cod' ? 'pending' : 'pending_transfer'

    const { data: order, error: orderError } = await admin.from('orders').insert({
      shipping_address: shippingData,
      total: verifiedTotal,
      status: orderStatus,
      payment_method: method,
      user_id: user.id,
      created_at: new Date().toISOString(),
    }).select('id').single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Sipariş oluşturulamadı: ' + orderError?.message }, { status: 500 })
    }

    const { error: itemsError } = await admin.from('order_items').insert(
      verifiedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        variant_id: item.variant_id ?? null,
        variant_name: item.variant_name ?? null,
        components_config: item.components_config ?? null,
      }))
    )
    if (itemsError) {
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Sipariş kalemleri kaydedilemedi' }, { status: 500 })
    }

    // Hediye çekini kullanılmış işaretle
    if (validatedVoucherId) {
      void admin.from('gift_vouchers').update({
        status: 'used',
        used_at: new Date().toISOString(),
        order_id: order.id,
      }).eq('id', validatedVoucherId).eq('status', 'active')
    }

    // Onay maili
    const { sendOrderConfirmation, sendAdminNewOrderNotification } = await import('@/lib/email')
    void Promise.all([
      sendOrderConfirmation(order.id),
      sendAdminNewOrderNotification(order.id),
    ]).catch((err) => console.error('[Email] Gönderim hatası:', err))

    // MessaPuan — sipariş başına kazanım
    void (async () => {
      try {
        const { getPointsConfig, awardPoints } = await import('@/lib/points')
        const cfg = await getPointsConfig()
        const orderPoints = cfg.order_tl_interval > 0
          ? Math.floor((verifiedTotal / cfg.order_tl_interval) * cfg.order_points)
          : 0
        if (orderPoints > 0) {
          await awardPoints(user.id, 'order', orderPoints, order.id)
        }
      } catch (err) {
        console.error('[MessaPuan] Sipariş puanı verilemedi:', err)
      }
    })()

    return NextResponse.json({ orderId: order.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}

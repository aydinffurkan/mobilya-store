import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQNBPaySettings, getToken, buildPaymentForm, CartItemPayload } from '@/lib/qnbpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shippingData, cardData, cartItems, total, installment, voucherCode } = body as {
      shippingData: {
        full_name: string
        email: string
        phone: string
        address: string
        city: string
        district: string
        zip_code: string
      }
      cardData: {
        number: string
        holder: string
        expiry: string  // MM/YY
        cvv: string
      }
      cartItems: CartItemPayload[]
      total: number
      installment: number
      voucherCode?: string | null
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const settings = await getQNBPaySettings()
    if (!settings?.enabled) {
      return NextResponse.json({ error: 'Ödeme sistemi aktif değil' }, { status: 503 })
    }

    const admin = createAdminClient()

    // --- Server-side price verification (prevents client-side price manipulation) ---
    const productIds = [...new Set(cartItems.map(i => i.product_id))]
    const variantIds = cartItems.filter(i => i.variant_id).map(i => i.variant_id!)

    type ConfigEntry = { component_id: string; quantity: number }
    const asConfig = (cfg: unknown): ConfigEntry[] =>
      Array.isArray(cfg) ? (cfg as ConfigEntry[]) : []
    const componentIds = [...new Set(
      cartItems.flatMap(i => asConfig(i.components_config).map(c => c.component_id)).filter(Boolean)
    )]

    const [{ data: dbProducts }, { data: dbVariants }, { data: dbComponents }] = await Promise.all([
      admin.from('products').select('id, price, sale_price, name').in('id', productIds),
      variantIds.length > 0
        ? admin.from('product_variants').select('id, price, sale_price, product_id').in('id', variantIds)
        : Promise.resolve({ data: [] as { id: string; price: number; sale_price: number | null; product_id: string }[] }),
      componentIds.length > 0
        ? admin.from('product_components').select('id, unit_price, product_id').in('id', componentIds)
        : Promise.resolve({ data: [] as { id: string; unit_price: number; product_id: string }[] }),
    ])

    const productMap = new Map((dbProducts ?? []).map(p => [p.id, p]))
    const variantMap = new Map((dbVariants ?? []).map(v => [v.id, v]))
    const componentMap = new Map((dbComponents ?? []).map(c => [c.id, c]))

    let verifiedTotal = 0
    const verifiedItems: CartItemPayload[] = []

    for (const item of cartItems) {
      let unitPrice: number

      if (item.variant_id) {
        const variant = variantMap.get(item.variant_id)
        if (!variant) return NextResponse.json({ error: `Varyant bulunamadı: ${item.variant_id}` }, { status: 400 })
        unitPrice = variant.sale_price ?? variant.price
      } else if (asConfig(item.components_config).length > 0) {
        // Component-based custom orders: recompute from DB, never trust client unit_price
        let sum = 0
        for (const entry of asConfig(item.components_config)) {
          const comp = componentMap.get(entry.component_id)
          if (!comp) return NextResponse.json({ error: `Parça bulunamadı: ${entry.component_id}` }, { status: 400 })
          if (comp.product_id !== item.product_id) return NextResponse.json({ error: 'Parça bu ürüne ait değil' }, { status: 400 })
          const compQty = Math.max(0, Math.floor(Number(entry.quantity)))
          sum += comp.unit_price * compQty
        }
        unitPrice = sum
      } else {
        const product = productMap.get(item.product_id)
        if (!product) return NextResponse.json({ error: `Ürün bulunamadı: ${item.product_id}` }, { status: 400 })
        unitPrice = product.sale_price ?? product.price
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity)))
      verifiedTotal += unitPrice * qty
      verifiedItems.push({ ...item, unit_price: unitPrice, quantity: qty })
    }

    verifiedTotal = Math.round(verifiedTotal * 100) / 100
    // --- End price verification ---

    // Hediye çeki doğrulama
    let validatedVoucherId: string | null = null
    if (voucherCode) {
      const now = new Date().toISOString()
      const { data: v, error: vErr } = await admin
        .from('gift_vouchers')
        .select('id, amount, status, expires_at, user_id')
        .eq('code', voucherCode.trim().toUpperCase())
        .single()
      if (vErr || !v) return NextResponse.json({ error: 'Hediye çeki bulunamadı' }, { status: 400 })
      if (v.user_id !== user.id) return NextResponse.json({ error: 'Bu hediye çeki size ait değil' }, { status: 400 })
      if (v.status !== 'active') return NextResponse.json({ error: 'Hediye çeki zaten kullanılmış' }, { status: 400 })
      if (v.expires_at < now) return NextResponse.json({ error: 'Hediye çekinin süresi dolmuş' }, { status: 400 })
      const discount = Math.min(Math.round(Number(v.amount) * 100) / 100, verifiedTotal)
      verifiedTotal = Math.max(0, Math.round((verifiedTotal - discount) * 100) / 100)
      validatedVoucherId = v.id as string
    }

    // Create order before redirecting to QNBPay
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        shipping_address: shippingData,
        total: verifiedTotal,
        status: 'pending_payment',
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Sipariş oluşturulamadı: ' + orderError?.message }, { status: 500 })
    }

    const orderItems = verifiedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      variant_id: item.variant_id ?? null,
      variant_name: item.variant_name ?? null,
      components_config: item.components_config ?? null,
    }))

    const { error: itemsError } = await admin.from('order_items').insert(orderItems)
    if (itemsError) {
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Sipariş kalemleri kaydedilemedi' }, { status: 500 })
    }

    // Hediye çekini bu sipariş ile ilişkilendir (ödeme onayında 'used' yapılacak)
    if (validatedVoucherId) {
      void admin.from('gift_vouchers')
        .update({ order_id: order.id })
        .eq('id', validatedVoucherId)
        .eq('status', 'active')
    }

    // Get QNBPay token (Bearer auth for all APIs except paySmart3D itself)
    const { token } = await getToken(settings)

    const [expiryMonth, expiryYear] = cardData.expiry.split('/')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? null
    // QNBPay rejects loopback/private IPs — omit the field when not a public address
    const isPrivate = !rawIp
      || rawIp === '127.0.0.1' || rawIp === '::1' || rawIp.startsWith('::ffff:127.')
      || rawIp.startsWith('10.') || rawIp.startsWith('192.168.')
      || /^172\.(1[6-9]|2\d|3[01])\./.test(rawIp)
    const userIp = isPrivate ? undefined : rawIp

    // Build auto-submit HTML form — must be submitted by browser, not via AJAX
    const formHtml = buildPaymentForm(settings, {
      token,
      orderId: order.id,
      total: verifiedTotal,
      installment: installment ?? 1,
      shippingData,
      cardNumber: cardData.number,
      cardHolder: cardData.holder,
      expiryMonth: expiryMonth.trim(),
      expiryYear: expiryYear.trim(),
      cvv: cardData.cvv,
      items: verifiedItems,
      returnUrl: `${siteUrl}/api/payment/qnbpay/callback`,
      cancelUrl: `${siteUrl}/api/payment/qnbpay/callback?cancelled=1`,
      userIp,
    })

    return NextResponse.json({ orderId: order.id, formHtml })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

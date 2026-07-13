'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface TrackingOrder {
  id: string
  shortId: string
  status: string
  total: number
  created_at: string
  carrier: string | null
  tracking_number: string | null
  shipping_address: Record<string, string>
  order_items: {
    id: string
    quantity: number
    unit_price: number
    variant_name: string | null
    product: { name: string; images: string[] } | null
  }[]
}

export async function lookupOrder(
  orderNo: string,
  email: string
): Promise<TrackingOrder | null> {
  const no = orderNo.trim().replace(/^#/, '').toLowerCase()
  const mail = email.trim().toLowerCase()
  if (!no || !mail) return null

  try {
    const admin = createAdminClient()

    // UUID prefix range: "a1b2c3d4" → gte a1b2c3d4-0000... lte a1b2c3d4-ffff...
    // ilike on uuid columns fails in PostgreSQL; range query is type-safe.
    const prefix = no.slice(0, 8).padEnd(8, '0')
    const minId = `${prefix}-0000-0000-0000-000000000000`
    const maxId = `${prefix}-ffff-ffff-ffff-ffffffffffff`

    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(*, product:products(name, images))')
      .gte('id', minId)
      .lte('id', maxId)
      .limit(5)

    if (error || !data?.length) return null

    // E-posta eşleşmesini sunucu tarafında kontrol et
    const order = data.find((o) => {
      const addr = (o.shipping_address ?? {}) as Record<string, string>
      return (addr.email ?? '').toLowerCase() === mail
    })

    if (!order) return null

    return {
      id: order.id,
      shortId: order.id.slice(0, 8).toUpperCase(),
      status: order.status,
      total: Number(order.total),
      created_at: order.created_at,
      carrier: order.carrier ?? null,
      tracking_number: order.tracking_number ?? null,
      shipping_address: (order.shipping_address ?? {}) as Record<string, string>,
      order_items: (order.order_items ?? []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        variant_name: item.variant_name ?? null,
        product: item.product
          ? { name: item.product.name, images: item.product.images ?? [] }
          : null,
      })),
    }
  } catch {
    return null
  }
}

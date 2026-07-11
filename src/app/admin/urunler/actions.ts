'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { ComponentTemplateItem } from '@/types'

interface ProductPayload {
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number | null
  category_id?: string | null
  supplier_id?: string | null
  stock: number
  is_featured?: boolean
  is_active?: boolean
  installment_count?: number | null
  fast_delivery?: boolean
  cart_discount_percent?: number | null
  images: string[]
  featured_specs?: string[]
  specs?: { key: string; value: string }[]
  dimensions?: { name: string; width: string; depth: string; height: string }[]
}

export async function saveProduct(productId: string | null, payload: ProductPayload): Promise<{ id: string }> {
  await requireAdmin()
  const adminClient = createAdminClient()
  let id = productId

  if (productId) {
    const { error } = await adminClient
      .from('products')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', productId)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await adminClient
      .from('products')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    id = data.id
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
  return { id: id! }
}

export async function duplicateProduct(productId: string): Promise<{ id: string }> {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Fetch original with variants and components
  const { data: original, error: fetchError } = await adminClient
    .from('products')
    .select('*, variants:product_variants(*), components:product_components(*)')
    .eq('id', productId)
    .single()
  if (fetchError || !original) throw new Error('Ürün bulunamadı')

  // Find a unique slug: kopya-{slug}, kopya-{slug}-2, etc.
  const baseSlug = `kopya-${original.slug}`
  const { data: clashes } = await adminClient
    .from('products')
    .select('slug')
    .like('slug', `${baseSlug}%`)
  const clashSet = new Set((clashes ?? []).map((r: { slug: string }) => r.slug))
  let newSlug = baseSlug
  let counter = 2
  while (clashSet.has(newSlug)) newSlug = `${baseSlug}-${counter++}`

  // Strip relation/meta fields before inserting
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _ca, updated_at: _ua, variants, components, category, ...productFields } = original

  const { data: newProduct, error: insertError } = await adminClient
    .from('products')
    .insert({
      ...productFields,
      name: `Kopya - ${original.name}`,
      slug: newSlug,
      is_active: false,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (insertError) throw new Error(insertError.message)

  // Copy variants
  if (variants?.length) {
    const rows = variants.map(({ id: _vid, product_id: _pid, created_at: _vca, updated_at: _vua, ...v }: Record<string, unknown>) => ({
      ...v,
      product_id: newProduct.id,
      created_at: new Date().toISOString(),
    }))
    const { error } = await adminClient.from('product_variants').insert(rows)
    if (error) throw new Error(error.message)
  }

  // Copy components
  if (components?.length) {
    const rows = components.map(({ id: _cid, product_id: _pid, created_at: _cca, updated_at: _cua, ...c }: Record<string, unknown>) => ({
      ...c,
      product_id: newProduct.id,
      created_at: new Date().toISOString(),
    }))
    const { error } = await adminClient.from('product_components').insert(rows)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
  return { id: newProduct.id }
}

export async function deleteProduct(productId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('products').delete().eq('id', productId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function bulkDeleteProducts(productIds: string[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('products').delete().in('id', productIds)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function bulkSetProductsActive(productIds: string[], isActive: boolean) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('products').update({ is_active: isActive, updated_at: new Date().toISOString() }).in('id', productIds)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export type BulkOpType =
  | 'price_increase_pct'
  | 'price_decrease_pct'
  | 'price_increase_fixed'
  | 'price_decrease_fixed'
  | 'sale_price_set_pct'
  | 'sale_price_remove'
  | 'stock_add'
  | 'stock_subtract'
  | 'stock_set'
  | 'stock_zero'
  | 'set_active'
  | 'set_passive'
  | 'change_supplier'

type AdminClient = ReturnType<typeof createAdminClient>

async function cascadeVariants(
  adminClient: AdminClient,
  productIds: string[],
  op: { type: BulkOpType; value?: number },
  now: string
) {
  const { data: rows } = await adminClient
    .from('product_variants')
    .select('id, price, sale_price, stock, is_active')
    .in('product_id', productIds)
  if (!rows?.length) return

  const pct = (op.value ?? 0) / 100
  await Promise.all(rows.map(async (v: Record<string, unknown>) => {
    const u: Record<string, unknown> = { updated_at: now }
    const vp = v.price as number | null
    const vs = v.stock as number
    switch (op.type) {
      case 'price_increase_pct':  if (vp != null) u.price = Math.max(1, Math.round(vp * (1 + pct))); break
      case 'price_decrease_pct':  if (vp != null) u.price = Math.max(1, Math.round(vp * (1 - pct))); break
      case 'price_increase_fixed': if (vp != null) u.price = Math.max(1, Math.round(vp + (op.value ?? 0))); break
      case 'price_decrease_fixed': if (vp != null) u.price = Math.max(1, Math.round(vp - (op.value ?? 0))); break
      case 'sale_price_set_pct':  if (vp != null) u.sale_price = Math.max(1, Math.round(vp * (1 - pct))); break
      case 'sale_price_remove':   u.sale_price = null; break
      case 'stock_add':      u.stock = vs + (op.value ?? 0); break
      case 'stock_subtract': u.stock = Math.max(0, vs - (op.value ?? 0)); break
      case 'stock_set':      u.stock = op.value ?? 0; break
      case 'stock_zero':     u.stock = 0; break
      case 'set_active':     u.is_active = true; break
      case 'set_passive':    u.is_active = false; break
    }
    await adminClient.from('product_variants').update(u).eq('id', v.id)
  }))
}

async function cascadeComponents(
  adminClient: AdminClient,
  productIds: string[],
  op: { type: BulkOpType; value?: number },
  now: string
) {
  const { data: rows } = await adminClient
    .from('product_components')
    .select('id, unit_price, stock, is_active')
    .in('product_id', productIds)
  if (!rows?.length) return

  const pct = (op.value ?? 0) / 100
  await Promise.all(rows.map(async (c: Record<string, unknown>) => {
    const u: Record<string, unknown> = { updated_at: now }
    const cp = c.unit_price as number
    const cs = c.stock as number
    switch (op.type) {
      case 'price_increase_pct':   u.unit_price = Math.max(1, Math.round(cp * (1 + pct))); break
      case 'price_decrease_pct':   u.unit_price = Math.max(1, Math.round(cp * (1 - pct))); break
      case 'price_increase_fixed': u.unit_price = Math.max(1, Math.round(cp + (op.value ?? 0))); break
      case 'price_decrease_fixed': u.unit_price = Math.max(1, Math.round(cp - (op.value ?? 0))); break
      // sale_price ops → parçalarda geçerli değil
      case 'stock_add':      u.stock = cs + (op.value ?? 0); break
      case 'stock_subtract': u.stock = Math.max(0, cs - (op.value ?? 0)); break
      case 'stock_set':      u.stock = op.value ?? 0; break
      case 'stock_zero':     u.stock = 0; break
      case 'set_active':     u.is_active = true; break
      case 'set_passive':    u.is_active = false; break
    }
    await adminClient.from('product_components').update(u).eq('id', c.id)
  }))
}

export async function bulkOperateProducts(
  productIds: string[],
  operation: { type: BulkOpType; value?: number; supplierId?: string | null },
  cascade: { variants: boolean; components: boolean } = { variants: false, components: false }
): Promise<{ updated: number }> {
  await requireAdmin()
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // change_supplier needs supplierId, handle separately
  if (operation.type === 'change_supplier') {
    const { error } = await adminClient
      .from('products')
      .update({ supplier_id: operation.supplierId ?? null, updated_at: now })
      .in('id', productIds)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/urunler')
    revalidatePath('/', 'layout')
    return { updated: productIds.length }
  }

  const simpleOps: Partial<Record<BulkOpType, Record<string, unknown>>> = {
    set_active:        { is_active: true,  updated_at: now },
    set_passive:       { is_active: false, updated_at: now },
    sale_price_remove: { sale_price: null, updated_at: now },
    stock_set:         { stock: operation.value ?? 0, updated_at: now },
    stock_zero:        { stock: 0, updated_at: now },
  }

  if (simpleOps[operation.type]) {
    const { error } = await adminClient.from('products').update(simpleOps[operation.type]!).in('id', productIds)
    if (error) throw new Error(error.message)
    if (cascade.variants)   await cascadeVariants(adminClient, productIds, operation, now)
    if (cascade.components) await cascadeComponents(adminClient, productIds, operation, now)
    revalidatePath('/admin/urunler')
    revalidatePath('/', 'layout')
    return { updated: productIds.length }
  }

  // Value-dependent operations: fetch current data first
  const { data: current, error: fetchErr } = await adminClient
    .from('products')
    .select('id, price, sale_price, stock')
    .in('id', productIds)
  if (fetchErr || !current) throw new Error(fetchErr?.message ?? 'Ürünler alınamadı')

  const errors = await Promise.all(
    current.map(async (p: { id: string; price: number; sale_price: number | null; stock: number }) => {
      const upd: Record<string, unknown> = { updated_at: now }
      const pct = (operation.value ?? 0) / 100

      switch (operation.type) {
        case 'price_increase_pct':
          upd.price = Math.max(1, Math.round(p.price * (1 + pct)))
          break
        case 'price_decrease_pct':
          upd.price = Math.max(1, Math.round(p.price * (1 - pct)))
          break
        case 'price_increase_fixed':
          upd.price = Math.max(1, Math.round(p.price + (operation.value ?? 0)))
          break
        case 'price_decrease_fixed':
          upd.price = Math.max(1, Math.round(p.price - (operation.value ?? 0)))
          break
        case 'sale_price_set_pct':
          upd.sale_price = Math.max(1, Math.round(p.price * (1 - pct)))
          break
        case 'stock_add':
          upd.stock = p.stock + (operation.value ?? 0)
          break
        case 'stock_subtract':
          upd.stock = Math.max(0, p.stock - (operation.value ?? 0))
          break
      }

      const { error } = await adminClient.from('products').update(upd).eq('id', p.id)
      return error?.message ?? null
    })
  )

  const failed = errors.filter(Boolean)
  if (failed.length > 0) throw new Error(`${failed.length} ürün güncellenemedi: ${failed[0]}`)

  if (cascade.variants)   await cascadeVariants(adminClient, productIds, operation, now)
  if (cascade.components) await cascadeComponents(adminClient, productIds, operation, now)

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
  return { updated: current.length }
}

export async function saveProductDetailFields(
  productId: string,
  fields: {
    featured_specs: string[]
    specs: { key: string; value: string }[]
    dimensions: { name: string; width: string; depth: string; height: string }[]
    faq_items: { q: string; a: string }[]
  }
) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('products')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', productId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

interface VariantPayload {
  name: string
  attributes: Record<string, string>
  price: number | null
  sale_price: number | null
  stock: number
  is_active: boolean
  sort_order: number
}

export async function saveVariant(productId: string, variantId: string | null, payload: VariantPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()

  if (variantId) {
    const { error } = await adminClient
      .from('product_variants')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', variantId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('product_variants')
      .insert({ ...payload, product_id: productId, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function deleteVariant(variantId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('product_variants').delete().eq('id', variantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

interface ComponentPayload {
  name: string
  unit_price: number
  default_quantity: number
  min_quantity: number
  max_quantity: number
  stock: number
  is_active: boolean
  sort_order: number
  image_url?: string | null
}

export async function saveComponent(productId: string, componentId: string | null, payload: ComponentPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()

  if (componentId) {
    const { error } = await adminClient
      .from('product_components')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', componentId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('product_components')
      .insert({ ...payload, product_id: productId, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function deleteComponent(componentId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('product_components').delete().eq('id', componentId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

interface BulkProductRow {
  name: string
  slug: string
  category_id: string | null
  price: number
  sale_price: number | null
  stock: number
  is_active: boolean
}

export async function bulkInsertProducts(
  rows: BulkProductRow[]
): Promise<{ results: { success: boolean; id?: string; message?: string }[] }> {
  await requireAdmin()
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  const results = await Promise.all(
    rows.map(async (row) => {
      const { data, error } = await adminClient
        .from('products')
        .insert({
          ...row,
          description: null,
          images: [],
          featured_specs: [],
          specs: [],
          dimensions: [],
          faq_items: [],
          is_featured: false,
          fast_delivery: false,
          installment_count: null,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single()
      if (error) return { success: false, message: error.message }
      return { success: true, id: data.id }
    })
  )

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
  return { results }
}

export async function applyComponentTemplate(productId: string, templateId: string, currentCount: number) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: template, error: templateError } = await adminClient
    .from('component_templates')
    .select('*')
    .eq('id', templateId)
    .single()
  if (templateError || !template) throw new Error('Şablon bulunamadı')

  const items = (template.items ?? []) as ComponentTemplateItem[]
  if (items.length === 0) throw new Error('Bu şablonda parça yok')

  const rows = items.map((item, index) => ({
    product_id: productId,
    name: item.name,
    unit_price: item.unit_price,
    default_quantity: item.default_quantity,
    min_quantity: item.min_quantity,
    max_quantity: item.max_quantity,
    stock: 0,
    is_active: true,
    sort_order: currentCount + index,
    created_at: new Date().toISOString(),
  }))

  const { error } = await adminClient.from('product_components').insert(rows)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

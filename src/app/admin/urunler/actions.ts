'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

interface ProductPayload {
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number | null
  category_id?: string | null
  stock: number
  is_featured?: boolean
  is_active?: boolean
  images: string[]
}

export async function saveProduct(productId: string | null, payload: ProductPayload) {
  const adminClient = createAdminClient()

  if (productId) {
    const { error } = await adminClient
      .from('products')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', productId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('products')
      .insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function deleteProduct(productId: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('products').delete().eq('id', productId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function bulkDeleteProducts(productIds: string[]) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('products').delete().in('id', productIds)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

export async function bulkSetProductsActive(productIds: string[], isActive: boolean) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('products').update({ is_active: isActive, updated_at: new Date().toISOString() }).in('id', productIds)
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
}

export async function saveComponent(productId: string, componentId: string | null, payload: ComponentPayload) {
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
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('product_components').delete().eq('id', componentId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/urunler')
  revalidatePath('/', 'layout')
}

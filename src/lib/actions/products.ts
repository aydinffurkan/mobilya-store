'use server'

import { getProductsByIds as _getProductsByIds } from '@/lib/repositories/products'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  return _getProductsByIds(ids)
}

export interface GroupCardOption {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  sale_price: number | null
  variant_group_label: string | null
}

/** Bir seçenek grubunun aktif ürünleri (kart/detay seçenekleri için). */
export async function getVariantGroupOptions(groupId: string): Promise<GroupCardOption[]> {
  if (!groupId) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, images, price, sale_price, variant_group_label')
      .eq('variant_group_id', groupId)
      .eq('is_active', true)
    return ((data ?? []) as GroupCardOption[]).sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
  } catch {
    return []
  }
}
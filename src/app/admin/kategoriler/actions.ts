'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { CategoryPromoCard } from '@/types'

interface CategoryPayload {
  name: string
  slug: string
  description?: string
  parent_id?: string | null
  image_url?: string | null
}

export async function saveCategory(categoryId: string | null, payload: CategoryPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()

  if (categoryId) {
    const { error } = await adminClient.from('categories').update(payload).eq('id', categoryId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient.from('categories').insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/kategoriler')
  revalidatePath('/', 'layout')
}

export async function saveCategoryPromoCards(categoryId: string, cards: CategoryPromoCard[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('categories').update({ promo_cards: cards }).eq('id', categoryId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/kategoriler')
  revalidatePath('/', 'layout')
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('categories').delete().eq('id', categoryId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/kategoriler')
  revalidatePath('/', 'layout')
}

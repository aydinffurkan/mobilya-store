'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'

export async function saveCustomerNote(customerId: string, note: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .upsert({ id: customerId, admin_note: note })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/musteriler/${customerId}`)
}

export async function saveCustomerTag(customerId: string, tag: string | null) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .upsert({ id: customerId, admin_tag: tag })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/musteriler/${customerId}`)
  revalidatePath('/admin/musteriler')
}
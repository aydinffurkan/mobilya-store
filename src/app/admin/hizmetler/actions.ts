'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'

interface ServicePayload {
  icon: string
  title: string
  description: string
  sort_order: number
  is_active: boolean
}

export async function saveService(serviceId: string | null, payload: ServicePayload) {
  await requireAdmin()
  const adminClient = createAdminClient()

  if (serviceId) {
    const { error } = await adminClient.from('services').update(payload).eq('id', serviceId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient.from('services').insert(payload)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/hizmetler')
  revalidatePath('/', 'layout')
}

export async function deleteService(serviceId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('services').delete().eq('id', serviceId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/hizmetler')
  revalidatePath('/', 'layout')
}

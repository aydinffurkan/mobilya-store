'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

interface ServicePayload {
  icon: string
  title: string
  description: string
  sort_order: number
  is_active: boolean
}

export async function saveService(serviceId: string | null, payload: ServicePayload) {
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
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('services').delete().eq('id', serviceId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/hizmetler')
  revalidatePath('/', 'layout')
}

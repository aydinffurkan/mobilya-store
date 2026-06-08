'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateOrderStatus(orderId: string, status: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('orders').update({ status }).eq('id', orderId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/siparisler')
  revalidatePath('/', 'layout')
}

export async function bulkUpdateOrderStatus(orderIds: string[], status: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('orders').update({ status }).in('id', orderIds)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/siparisler')
  revalidatePath('/', 'layout')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { sendStatusUpdate } from '@/lib/email'

const NOTIFY_STATUSES = new Set(['confirmed', 'shipped', 'delivered', 'cancelled'])

const revalidate = () => {
  revalidatePath('/admin/siparisler')
  revalidatePath('/admin/siparisler/[id]', 'page')
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('orders').update({ status }).eq('id', orderId)
  if (error) throw new Error(error.message)
  revalidate()

  if (NOTIFY_STATUSES.has(status)) {
    void sendStatusUpdate(orderId, status).catch((err) => console.error('[Email] Durum maili hatası:', err))
  }
}

export async function bulkUpdateOrderStatus(orderIds: string[], status: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('orders').update({ status }).in('id', orderIds)
  if (error) throw new Error(error.message)
  revalidate()
}

export async function saveOrderCargoInfo(
  orderId: string,
  payload: { tracking_number: string; carrier: string }
) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('orders')
    .update(payload)
    .eq('id', orderId)
  if (error) throw new Error(error.message)
  revalidate()
}

export async function saveOrderNote(orderId: string, admin_note: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('orders')
    .update({ admin_note })
    .eq('id', orderId)
  if (error) throw new Error(error.message)
  revalidate()
}
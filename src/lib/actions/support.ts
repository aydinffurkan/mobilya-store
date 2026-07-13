'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { revalidatePath } from 'next/cache'
import { sendTicketStatusUpdate } from '@/lib/email'

export interface SupportTicket {
  id: string
  order_id: string | null
  type: 'ariza' | 'iade'
  status: 'beklemede' | 'inceleniyor' | 'cozuldu' | 'reddedildi'
  subject: string
  description: string
  images: string[]
  admin_note: string | null
  created_at: string
  updated_at: string
  order?: { id: string } | null
}

export interface AdminTicket extends SupportTicket {
  user_id: string
  user_email?: string
  shipping_name?: string
}

export interface CreateTicketPayload {
  order_id: string | null
  type: 'ariza' | 'iade'
  subject: string
  description: string
  images: string[]
}

// ─── Müşteri ─────────────────────────────────────────────────────────────────

export async function getMyTickets(): Promise<SupportTicket[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as SupportTicket[]
}

export async function createTicket(payload: CreateTicketPayload): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum açmanız gerekiyor')

  const { error } = await supabase.from('support_tickets').insert({
    user_id:     user.id,
    order_id:    payload.order_id || null,
    type:        payload.type,
    subject:     payload.subject.trim(),
    description: payload.description.trim(),
    images:      payload.images ?? [],
  })

  if (error) throw new Error(error.message)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminTickets(): Promise<AdminTicket[]> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (!data?.length) return []

  // Kullanıcı e-postalarını auth üzerinden çek
  const userIds = [...new Set(data.map((t: any) => t.user_id as string))]
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(users.map((u) => [u.id, u.email ?? '']))

  return data.map((t: any) => ({
    ...t,
    user_email: emailMap.get(t.user_id) ?? '',
  })) as AdminTicket[]
}

export async function getAdminTicket(id: string): Promise<AdminTicket | null> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('support_tickets')
    .select('*, order:orders(id, total, created_at, shipping_address)')
    .eq('id', id)
    .single()

  if (!data) return null

  const { data: { user } } = await admin.auth.admin.getUserById(data.user_id)

  return {
    ...data,
    user_email: user?.email ?? '',
    shipping_name: (data.order?.shipping_address as Record<string, string>)?.full_name ?? '',
  } as AdminTicket
}

export async function updateTicketStatus(
  id: string,
  status: AdminTicket['status'],
  admin_note?: string,
): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (admin_note !== undefined) update.admin_note = admin_note

  const { data: ticket, error } = await admin
    .from('support_tickets')
    .update(update)
    .eq('id', id)
    .select('id, subject, type, status, admin_note, user_id')
    .single()
  if (error) throw new Error(error.message)

  // Müşteriye bildirim maili
  if (ticket) {
    const { data: { user } } = await admin.auth.admin.getUserById(ticket.user_id)
    const email = user?.email ?? ''
    void sendTicketStatusUpdate(
      { ...ticket, admin_note: admin_note ?? ticket.admin_note },
      email,
    ).catch((err) => console.error('[Email] Destek mail hatası:', err))
  }

  revalidatePath('/admin/destek')
  revalidatePath(`/admin/destek/${id}`)
}

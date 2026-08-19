'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/supabase/auth-guard'
import { revalidatePath } from 'next/cache'

export interface AdminUser {
  id: string
  email: string
  is_owner: boolean
  created_at: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Tüm admin kullanıcılarını listeler (owner + alt adminler). Owner-only. */
export async function listAdmins(): Promise<AdminUser[]> {
  await requireOwner()
  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  return (data?.users ?? [])
    .filter((u) => u.app_metadata?.role === 'admin')
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      is_owner: u.app_metadata?.is_owner === true,
      created_at: u.created_at,
    }))
    .sort((a, b) => Number(b.is_owner) - Number(a.is_owner) || a.email.localeCompare(b.email))
}

/** Yeni alt admin oluşturur (e-posta + şifre, anında aktif). Owner-only. */
export async function createSubAdmin(input: { email: string; password: string }): Promise<void> {
  await requireOwner()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (!EMAIL_RE.test(email)) throw new Error('Geçerli bir e-posta adresi giriniz')
  if (password.length < 8) throw new Error('Şifre en az 8 karakter olmalı')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' }, // is_owner YOK → alt admin
  })
  if (error) {
    const msg = error.message.toLowerCase()
    throw new Error(
      msg.includes('already') || msg.includes('registered') || msg.includes('exists')
        ? 'Bu e-posta zaten kayıtlı'
        : error.message
    )
  }
  revalidatePath('/admin/adminler')
}

/** Bir alt admini siler. Owner-only. Owner ve kendini silemez. */
export async function deleteSubAdmin(userId: string): Promise<void> {
  const owner = await requireOwner()
  if (userId === owner.id) throw new Error('Kendinizi silemezsiniz')

  const admin = createAdminClient()
  const { data: target } = await admin.auth.admin.getUserById(userId)
  if (!target?.user) throw new Error('Kullanıcı bulunamadı')
  if (target.user.app_metadata?.is_owner === true) throw new Error('Owner silinemez')
  if (target.user.app_metadata?.role !== 'admin') throw new Error('Bu kullanıcı admin değil')

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/adminler')
}

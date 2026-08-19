import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Oturumdaki kullanıcıyı sunucuda doğrular.
 * React cache ile sarmalı: aynı istek içinde layout + page + alt bileşenler
 * çağırsa bile Auth sunucusuna tek istek gider (rate limit).
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/** Admin sayfaları için — admin değilse anasayfaya yönlendirir */
export async function requireAdminPage() {
  const user = await getCurrentUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/')
  return user
}

/** Admin server action'ları için — admin değilse hata fırlatır */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Yetkisiz erişim')
  }
  return user
}

/** Owner (ana admin) sayfaları için — admin değilse anasayfaya, owner değilse /admin'e yönlendirir */
export async function requireOwnerPage() {
  const user = await getCurrentUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/')
  if (user.app_metadata?.is_owner !== true) redirect('/admin')
  return user
}

/** Owner-only server action'ları için — owner değilse hata fırlatır */
export async function requireOwner() {
  const user = await getCurrentUser()
  if (!user || user.app_metadata?.role !== 'admin' || user.app_metadata?.is_owner !== true) {
    throw new Error('Bu işlem için owner yetkisi gerekli')
  }
  return user
}

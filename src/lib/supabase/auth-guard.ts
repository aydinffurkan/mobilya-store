import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** Admin sayfaları için — admin değilse anasayfaya yönlendirir */
export async function requireAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/')
  return user
}

/** Admin server action'ları için — admin değilse hata fırlatır */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Yetkisiz erişim')
  }
  return user
}
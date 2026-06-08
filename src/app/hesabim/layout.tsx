import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/auth/giris?redirect=/hesabim')
  return <>{children}</>
}

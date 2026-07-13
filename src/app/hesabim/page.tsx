import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HesabimClient from '@/components/account/HesabimClient'
import { getAddresses } from '@/lib/actions/account'
import { getMyTickets } from '@/lib/actions/support'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/giris')

  const [{ data: profile }, { data: orders }, addresses, tickets] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders')
      .select('*, order_items(*, product:products(name, images))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    getAddresses().catch(() => []),
    getMyTickets().catch(() => []),
  ])

  return (
    <HesabimClient
      user={{ id: user.id, email: user.email ?? '', created_at: user.created_at }}
      profile={profile}
      orders={orders ?? []}
      addresses={addresses}
      tickets={tickets}
    />
  )
}

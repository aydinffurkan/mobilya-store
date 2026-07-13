'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { full_name: string; phone: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum açık değil')
  const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/hesabim')
}

// ─── Adresler ────────────────────────────────────────────────────────────────

export interface Address {
  id: string
  title: string
  full_name: string
  phone: string
  city: string
  district: string
  address: string
  postal_code: string
  is_default: boolean
}

export type AddressPayload = Omit<Address, 'id'>

export async function getAddresses(): Promise<Address[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('user_addresses')
    .select('id,title,full_name,phone,city,district,address,postal_code,is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
  return (data ?? []) as Address[]
}

export async function saveAddress(id: string | null, payload: AddressPayload): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum açık değil')

  if (payload.is_default) {
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  if (id) {
    const { error } = await supabase
      .from('user_addresses').update(payload).eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('user_addresses').insert({ ...payload, user_id: user.id })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/hesabim')
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum açık değil')
  const { error } = await supabase
    .from('user_addresses').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/hesabim')
}

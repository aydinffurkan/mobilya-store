'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { revalidatePath } from 'next/cache'

export interface KapiOdemeSettings {
  enabled: boolean
  extra_fee: number
  description: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  iban: string
  branch: string
}

export interface HavaleSettings {
  enabled: boolean
  description: string
  accounts: BankAccount[]
}

export async function saveKapiOdeme(data: KapiOdemeSettings): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('site_settings').upsert({
    key: 'kapi_odeme', value: data, updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/odeme')
}

export async function saveHavale(data: HavaleSettings): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('site_settings').upsert({
    key: 'havale', value: data, updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/odeme')
}

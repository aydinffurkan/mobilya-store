'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'

interface SupplierPayload {
  name: string
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
}

export async function saveSupplier(supplierId: string | null, payload: SupplierPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()

  if (supplierId) {
    const { error } = await adminClient.from('suppliers').update(payload).eq('id', supplierId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient.from('suppliers').insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/tedarikciler')
  revalidatePath('/admin/urunler')
}

export async function deleteSupplier(supplierId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('suppliers').delete().eq('id', supplierId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tedarikciler')
  revalidatePath('/admin/urunler')
}

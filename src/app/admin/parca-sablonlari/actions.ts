'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { ComponentTemplateItem } from '@/types'

interface ComponentTemplatePayload {
  name: string
  items: ComponentTemplateItem[]
}

export async function saveComponentTemplate(templateId: string | null, payload: ComponentTemplatePayload) {
  await requireAdmin()
  const adminClient = createAdminClient()

  if (templateId) {
    const { error } = await adminClient
      .from('component_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', templateId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('component_templates')
      .insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/parca-sablonlari')
  revalidatePath('/admin/urunler')
}

export async function deleteComponentTemplate(templateId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('component_templates').delete().eq('id', templateId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/parca-sablonlari')
  revalidatePath('/admin/urunler')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

interface VariantTemplatePayload {
  name: string
  options: string[]
}

export async function saveVariantTemplate(templateId: string | null, payload: VariantTemplatePayload) {
  const adminClient = createAdminClient()

  if (templateId) {
    const { error } = await adminClient
      .from('variant_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', templateId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('variant_templates')
      .insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/varyantlar')
  revalidatePath('/admin/urunler')
}

export async function deleteVariantTemplate(templateId: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('variant_templates').delete().eq('id', templateId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/varyantlar')
  revalidatePath('/admin/urunler')
}

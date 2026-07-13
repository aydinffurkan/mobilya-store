'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { ProductSpec, ProductDimension, FAQItem } from '@/types'

// ── Ölçü Şablonları ──────────────────────────────────────────────────────────

export async function saveDimensionTemplate(
  templateId: string | null,
  payload: { name: string; items: ProductDimension[] }
) {
  await requireAdmin()
  const adminClient = createAdminClient()
  if (templateId) {
    const { error } = await adminClient
      .from('dimension_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', templateId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('dimension_templates')
      .insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/admin/sablonlar')
  revalidatePath('/admin/urunler')
}

export async function deleteDimensionTemplate(templateId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('dimension_templates').delete().eq('id', templateId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/sablonlar')
  revalidatePath('/admin/urunler')
}

// ── Özellik Şablonları ────────────────────────────────────────────────────────

export async function saveSpecTemplate(
  templateId: string | null,
  payload: { name: string; items: ProductSpec[] }
) {
  await requireAdmin()
  const adminClient = createAdminClient()
  if (templateId) {
    const { error } = await adminClient
      .from('spec_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', templateId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('spec_templates')
      .insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/admin/sablonlar')
  revalidatePath('/admin/urunler')
}

export async function deleteSpecTemplate(templateId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('spec_templates').delete().eq('id', templateId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/sablonlar')
  revalidatePath('/admin/urunler')
}

// ── SSS Şablonları ────────────────────────────────────────────────────────────

export async function saveFAQTemplate(
  templateId: string | null,
  payload: { name: string; items: FAQItem[] }
) {
  await requireAdmin()
  const adminClient = createAdminClient()
  if (templateId) {
    const { error } = await adminClient
      .from('faq_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', templateId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await adminClient
      .from('faq_templates')
      .insert({ ...payload, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/admin/sablonlar')
  revalidatePath('/admin/urunler')
}

export async function deleteFAQTemplate(templateId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('faq_templates').delete().eq('id', templateId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/sablonlar')
  revalidatePath('/admin/urunler')
}
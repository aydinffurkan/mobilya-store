'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'

interface SeoPayload {
  site_title: string
  meta_description: string
  keywords: string
  og_image: string
  google_site_verification: string
  robots_index: boolean
}

export async function saveSeoSettings(payload: SeoPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'seo', value: payload, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

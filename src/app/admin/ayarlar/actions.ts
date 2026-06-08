'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { HeroSlide } from '@/types'

export async function saveSiteSettings(
  heroData: Record<string, string>,
  contactData: Record<string, string>
) {
  const adminClient = createAdminClient()
  const [r1, r2] = await Promise.all([
    adminClient.from('site_settings').upsert({ key: 'hero', value: heroData, updated_at: new Date().toISOString() }),
    adminClient.from('site_settings').upsert({ key: 'contact', value: contactData, updated_at: new Date().toISOString() }),
  ])
  if (r1.error || r2.error) throw new Error(r1.error?.message ?? r2.error?.message)
  revalidatePath('/', 'layout')
}

export async function saveHeroSlider(slides: HeroSlide[]) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'slider', value: { slides }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

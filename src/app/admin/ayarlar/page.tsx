import { createAdminClient } from '@/lib/supabase/admin'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'
import SliderManager from '@/components/admin/SliderManager'
import { HeroSlide } from '@/types'

export default async function AdminSettingsPage() {
  const adminClient = createAdminClient()
  const [{ data: heroData }, { data: contactData }, { data: sliderData }] = await Promise.all([
    adminClient.from('site_settings').select('value').eq('key', 'hero').single(),
    adminClient.from('site_settings').select('value').eq('key', 'contact').single(),
    adminClient.from('site_settings').select('value').eq('key', 'slider').single(),
  ])

  const slides = ((sliderData?.value as { slides?: HeroSlide[] } | null)?.slides) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">Ana sayfa ve iletişim bilgilerini düzenle</p>
      </div>
      <SliderManager slides={slides} />
      <SiteSettingsForm hero={heroData?.value ?? {}} contact={contactData?.value ?? {}} />
    </div>
  )
}

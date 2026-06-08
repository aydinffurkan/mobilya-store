import { createAdminClient } from '@/lib/supabase/admin'
import SeoSettingsForm from '@/components/admin/SeoSettingsForm'

export default async function AdminSeoPage() {
  const adminClient = createAdminClient()
  const { data } = await adminClient.from('site_settings').select('value').eq('key', 'seo').single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">SEO Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">Sitenizin arama motorlarında ve sosyal medyada görünümünü düzenleyin</p>
      </div>
      <SeoSettingsForm seo={data?.value ?? {}} />
    </div>
  )
}

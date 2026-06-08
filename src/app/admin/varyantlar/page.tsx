import { createAdminClient } from '@/lib/supabase/admin'
import { VariantTemplate } from '@/types'
import VariantTemplateManager from '@/components/admin/VariantTemplateManager'

async function getTemplates(): Promise<VariantTemplate[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('variant_templates').select('*').order('name')
    if (error || !data) return []
    return data as VariantTemplate[]
  } catch {
    return []
  }
}

export default async function AdminVariantTemplatesPage() {
  const templates = await getTemplates()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Varyantlar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {templates.length} şablon — ürün düzenleme sayfasında varyant eklerken kullanılır
        </p>
      </div>

      <VariantTemplateManager templates={templates} />
    </div>
  )
}

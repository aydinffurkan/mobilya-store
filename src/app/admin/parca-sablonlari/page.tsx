import { createAdminClient } from '@/lib/supabase/admin'
import { ComponentTemplate } from '@/types'
import ComponentTemplateManager from '@/components/admin/ComponentTemplateManager'

async function getTemplates(): Promise<ComponentTemplate[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('component_templates').select('*').order('name')
    if (error || !data) return []
    return data as ComponentTemplate[]
  } catch {
    return []
  }
}

export default async function AdminComponentTemplatesPage() {
  const templates = await getTemplates()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Parça Şablonları</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {templates.length} şablon — ürün düzenleme sayfasında "İçeriği Özelleştir" parçalarını tek tıkla oluşturmak için kullanılır
        </p>
      </div>

      <ComponentTemplateManager templates={templates} />
    </div>
  )
}

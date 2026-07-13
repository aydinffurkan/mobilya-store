import { createAdminClient } from '@/lib/supabase/admin'
import { VariantTemplate, ComponentTemplate, DimensionTemplate, SpecTemplate, FAQTemplate } from '@/types'
import SablonlarClient from '@/components/admin/SablonlarClient'

async function getAllTemplates() {
  try {
    const adminClient = createAdminClient()
    const [
      { data: variantTemplates },
      { data: componentTemplates },
      { data: dimensionTemplates },
      { data: specTemplates },
      { data: faqTemplates },
    ] = await Promise.all([
      adminClient.from('variant_templates').select('*').order('name'),
      adminClient.from('component_templates').select('*').order('name'),
      adminClient.from('dimension_templates').select('*').order('name'),
      adminClient.from('spec_templates').select('*').order('name'),
      adminClient.from('faq_templates').select('*').order('name'),
    ])
    return {
      variantTemplates:   (variantTemplates   as VariantTemplate[]  ) ?? [],
      componentTemplates: (componentTemplates as ComponentTemplate[] ) ?? [],
      dimensionTemplates: (dimensionTemplates as DimensionTemplate[] ) ?? [],
      specTemplates:      (specTemplates      as SpecTemplate[]      ) ?? [],
      faqTemplates:       (faqTemplates       as FAQTemplate[]       ) ?? [],
    }
  } catch {
    return { variantTemplates: [], componentTemplates: [], dimensionTemplates: [], specTemplates: [], faqTemplates: [] }
  }
}

export default async function SablonlarPage() {
  const data = await getAllTemplates()
  const total = data.variantTemplates.length + data.componentTemplates.length +
                data.dimensionTemplates.length + data.specTemplates.length + data.faqTemplates.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Şablonlar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {total} şablon — varyant, parça, ölçü ve özellik şablonlarını tek sayfadan yönetin
        </p>
      </div>
      <SablonlarClient {...data} />
    </div>
  )
}
import ProductForm from '@/components/admin/ProductForm'
import { createAdminClient } from '@/lib/supabase/admin'
import { Category, Supplier, DimensionTemplate, SpecTemplate, FAQTemplate } from '@/types'

async function getData() {
  try {
    const adminClient = createAdminClient()
    const [
      { data: categories },
      { data: suppliers },
      { data: dimensionTemplates },
      { data: specTemplates },
      { data: faqTemplates },
    ] = await Promise.all([
      adminClient.from('categories').select('*').order('name'),
      adminClient.from('suppliers').select('*').order('name'),
      adminClient.from('dimension_templates').select('*').order('name'),
      adminClient.from('spec_templates').select('*').order('name'),
      adminClient.from('faq_templates').select('*').order('name'),
    ])
    return {
      categories:         (categories         as Category[]         ) ?? [],
      suppliers:          (suppliers          as Supplier[]         ) ?? [],
      dimensionTemplates: (dimensionTemplates as DimensionTemplate[] ) ?? [],
      specTemplates:      (specTemplates      as SpecTemplate[]      ) ?? [],
      faqTemplates:       (faqTemplates       as FAQTemplate[]       ) ?? [],
    }
  } catch {
    return { categories: [], suppliers: [], dimensionTemplates: [], specTemplates: [], faqTemplates: [] }
  }
}

export default async function NewProductPage() {
  const { categories, suppliers, dimensionTemplates, specTemplates, faqTemplates } = await getData()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Yeni Ürün Ekle</h1>
        <p className="text-muted-foreground text-sm mt-1">Mağazanıza yeni bir ürün ekleyin</p>
      </div>
      <ProductForm
        categories={categories}
        suppliers={suppliers}
        dimensionTemplates={dimensionTemplates}
        specTemplates={specTemplates}
        faqTemplates={faqTemplates}
      />
    </div>
  )
}

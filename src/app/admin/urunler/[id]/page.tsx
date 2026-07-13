import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import { createAdminClient } from '@/lib/supabase/admin'
import { Category, Product, Supplier, VariantTemplate, ComponentTemplate, DimensionTemplate, SpecTemplate, FAQTemplate } from '@/types'

async function getData(id: string): Promise<{
  product: Product
  categories: Category[]
  suppliers: Supplier[]
  templates: VariantTemplate[]
  componentTemplates: ComponentTemplate[]
  dimensionTemplates: DimensionTemplate[]
  specTemplates: SpecTemplate[]
  faqTemplates: FAQTemplate[]
} | null> {
  try {
    const adminClient = createAdminClient()
    const [
      { data: product },
      { data: categories },
      { data: suppliers },
      { data: variants },
      { data: templates },
      { data: components },
      { data: componentTemplates },
      { data: dimensionTemplates },
      { data: specTemplates },
      { data: faqTemplates },
    ] = await Promise.all([
      adminClient.from('products').select('*').eq('id', id).single(),
      adminClient.from('categories').select('*').order('name'),
      adminClient.from('suppliers').select('*').order('name'),
      adminClient.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
      adminClient.from('variant_templates').select('*').order('name'),
      adminClient.from('product_components').select('*').eq('product_id', id).order('sort_order'),
      adminClient.from('component_templates').select('*').order('name'),
      adminClient.from('dimension_templates').select('*').order('name'),
      adminClient.from('spec_templates').select('*').order('name'),
      adminClient.from('faq_templates').select('*').order('name'),
    ])
    if (!product) return null
    return {
      product: { ...product, variants: variants ?? [], components: components ?? [] } as Product,
      categories:         (categories         as Category[]         ) ?? [],
      suppliers:          (suppliers          as Supplier[]         ) ?? [],
      templates:          (templates          as VariantTemplate[]  ) ?? [],
      componentTemplates: (componentTemplates as ComponentTemplate[] ) ?? [],
      dimensionTemplates: (dimensionTemplates as DimensionTemplate[] ) ?? [],
      specTemplates:      (specTemplates      as SpecTemplate[]      ) ?? [],
      faqTemplates:       (faqTemplates       as FAQTemplate[]       ) ?? [],
    }
  } catch {
    return null
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)

  if (!data) notFound()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ürünü Düzenle</h1>
        <p className="text-muted-foreground text-sm mt-1">{data.product.name}</p>
      </div>
      <ProductForm
        categories={data.categories}
        suppliers={data.suppliers}
        product={data.product}
        variantTemplates={data.templates}
        componentTemplates={data.componentTemplates}
        dimensionTemplates={data.dimensionTemplates}
        specTemplates={data.specTemplates}
        faqTemplates={data.faqTemplates}
      />
    </div>
  )
}

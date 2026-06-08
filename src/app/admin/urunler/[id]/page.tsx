import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import { createAdminClient } from '@/lib/supabase/admin'
import { Category, Product, VariantTemplate } from '@/types'

async function getData(id: string): Promise<{ product: Product; categories: Category[]; templates: VariantTemplate[] } | null> {
  try {
    const adminClient = createAdminClient()
    const [{ data: product }, { data: categories }, { data: variants }, { data: templates }, { data: components }] = await Promise.all([
      adminClient.from('products').select('*').eq('id', id).single(),
      adminClient.from('categories').select('*').order('name'),
      adminClient.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
      adminClient.from('variant_templates').select('*').order('name'),
      adminClient.from('product_components').select('*').eq('product_id', id).order('sort_order'),
    ])
    if (!product) return null
    return {
      product: { ...product, variants: variants ?? [], components: components ?? [] } as Product,
      categories: (categories as Category[]) ?? [],
      templates: (templates as VariantTemplate[]) ?? [],
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
      <ProductForm categories={data.categories} product={data.product} variantTemplates={data.templates} />
    </div>
  )
}

import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import { createClient } from '@/lib/supabase/server'
import { Category, Product } from '@/types'

async function getData(id: string): Promise<{ product: Product; categories: Category[] } | null> {
  try {
    const supabase = await createClient()
    const [{ data: product }, { data: categories }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('categories').select('*').order('name'),
    ])
    if (!product) return null
    return { product: product as Product, categories: (categories as Category[]) ?? [] }
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
      <ProductForm categories={data.categories} product={data.product} />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import ProductViewTracker from '@/components/products/ProductViewTracker'
import ProductDetailClient from '@/components/products/ProductDetailClient'
import RecentlyViewedProducts from '@/components/products/RecentlyViewedProducts'
import AlternativeProducts from '@/components/products/AlternativeProducts'
import ProductReviews from '@/components/products/ProductReviews'

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*), components:product_components(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    return (data as Product) ?? null
  } catch {
    return null
  }
}

export interface GroupOption {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  sale_price: number | null
  variant_group_label: string | null
}

async function getGroupOptions(product: Product): Promise<GroupOption[]> {
  if (!product.variant_group_id) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, images, price, sale_price, variant_group_label')
      .eq('variant_group_id', product.variant_group_id)
      .eq('is_active', true)
    return ((data ?? []) as GroupOption[]).sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
  } catch { return [] }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  const groupOptions = await getGroupOptions(product)

  return (
    <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-0 pb-24 sm:pb-12">
      <ProductViewTracker productId={product.id} />
      <ProductDetailClient product={product} groupOptions={groupOptions} />
      <ProductReviews productId={product.id} />
      <AlternativeProducts product={product} />
      <RecentlyViewedProducts currentProductId={product.id} />
    </main>
  )
}
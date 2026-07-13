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

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return (
    <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pt-0 pb-24 sm:pb-12">
      <ProductViewTracker productId={product.id} />
      <ProductDetailClient product={product} />
      <ProductReviews productId={product.id} />
      <AlternativeProducts product={product} />
      <RecentlyViewedProducts currentProductId={product.id} />
    </main>
  )
}
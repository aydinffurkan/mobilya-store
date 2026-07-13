import { getAlternativeProducts } from '@/lib/repositories/products'
import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'

export default async function AlternativeProducts({ product }: { product: Product }) {
  if (!product.category_id) return null

  const products = await getAlternativeProducts(
    product.id,
    product.category_id,
    product.sale_price ?? product.price
  )

  if (!products.length) return null

  return (
    <section className="mt-16 md:mt-24">
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-light tracking-wide text-neutral-900 uppercase">
          Alternatif Ürünler
        </h2>
        <span className="text-xs text-muted-foreground">
          {product.category?.name ?? ''} kategorisinden benzer fiyatlılar
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
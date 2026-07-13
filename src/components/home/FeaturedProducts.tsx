import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import { getFeaturedProducts } from '@/lib/repositories/products'

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts(8)

  return (
    <section className="bg-secondary/40 py-14">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Öne Çıkan Ürünler</h2>
            <p className="text-muted-foreground mt-1 text-sm">Sizin için seçtiklerimiz</p>
          </div>
          <Link href="/urunler" className="text-sm font-medium text-[#222222] hover:underline hidden md:block">
            Tüm Ürünler →
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Henüz öne çıkan ürün eklenmemiş.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link href="/urunler" className="text-sm font-medium text-[#222222] hover:underline">
            Tüm ürünleri gör →
          </Link>
        </div>
      </div>
    </section>
  )
}

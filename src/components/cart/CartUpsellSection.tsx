import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'

interface Props {
  products: Product[]
}

export default function CartUpsellSection({ products }: Props) {
  if (!products.length) return null

  return (
    <section className="bg-[#F8F8F6] border-t border-border py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium mb-1">
            Önerilen Ürünler
          </p>
          <h2 className="text-xl font-bold text-neutral-900">
            Kasa Arkası Ürünler
          </h2>
        </div>

        {/* Az ürün olsa bile satırı eşit doldursun diye grid — sabit genişlikli
            kaydırma şeridi az ürünle sağda boş alan bırakıp dengesiz görünüyordu. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  )
}

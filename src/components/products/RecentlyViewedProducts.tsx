'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { getProductsByIds } from '@/lib/actions/products'
import ProductCard from '@/components/products/ProductCard'

const LS_KEY = 'recently_viewed'

export default function RecentlyViewedProducts({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const ids: string[] = JSON.parse(raw)
      const filtered = ids.filter((id) => id !== currentProductId)
      if (!filtered.length) return
      getProductsByIds(filtered).then(setProducts)
    } catch {}
  }, [currentProductId])

  if (!products.length) return null

  return (
    <section className="mt-16 md:mt-24">
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-light tracking-wide text-neutral-900 uppercase">
          Son Gezilen Ürünler
        </h2>
        <span className="text-xs text-muted-foreground">{products.length} ürün</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
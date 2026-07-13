'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { useFavoritesStore } from '@/store/favoritesStore'
import { getProductsByIds } from '@/lib/actions/products'
import ProductCard from '@/components/products/ProductCard'
import type { Product } from '@/types'

export default function FavorilerimPage() {
  const ids    = useFavoritesStore((s) => s.ids)
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); setLoading(false); return }
    setLoading(true)
    getProductsByIds(ids)
      .then((data) => setProducts((data as Product[]) ?? []))
      .finally(() => setLoading(false))
  }, [ids])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <Heart size={18} className="text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Favorilerim</h1>
          <p className="text-muted-foreground text-sm">{ids.length} ürün kaydedildi</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
            <Heart size={32} className="text-neutral-300" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Henüz favori ürün eklemediniz</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Ürün kartlarındaki kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.
          </p>
          <Link
            href="/urunler"
            className="inline-flex items-center gap-2 bg-[#222222] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#222222] transition-colors"
          >
            <ShoppingBag size={15} /> Ürünlere Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
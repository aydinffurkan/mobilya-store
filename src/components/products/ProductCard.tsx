'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  const discountPercent = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
    toast.success(`${product.name} sepete eklendi`)
  }

  return (
    <Link href={`/urunler/${product.slug}`} className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#8B6914]/30 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Görsel Yok
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPercent && (
            <Badge className="bg-red-500 text-white text-xs px-2">-%{discountPercent}</Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-[#8B6914] text-white text-xs px-2">Öne Çıkan</Badge>
          )}
        </div>

        {/* Wishlist */}
        <button className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-200 shadow-sm">
          <Heart size={15} className="text-gray-500 hover:text-red-500" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs text-muted-foreground">{product.category?.name ?? ''}</p>
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{product.name}</h3>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            {product.sale_price ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-[#8B6914]">
                  {product.sale_price.toLocaleString('tr-TR')} ₺
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {product.price.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            ) : (
              <span className="text-base font-bold text-[#8B6914]">
                {product.price.toLocaleString('tr-TR')} ₺
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 flex-shrink-0 border-[#8B6914]/30 hover:bg-[#8B6914] hover:text-white hover:border-[#8B6914] transition-colors"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={14} />
          </Button>
        </div>
      </div>
    </Link>
  )
}

'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { Product } from '@/types'
import { toast } from 'sonner'

export default function AddToCartButton({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  const handleAdd = () => {
    addItem(product, quantity)
    toast.success(`${product.name} sepete eklendi`, {
      description: `${quantity} adet`,
    })
  }

  return (
    <div className="space-y-3">
      {/* Quantity picker */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Adet:</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            className="px-3 py-2 hover:bg-secondary transition-colors"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus size={14} />
          </button>
          <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">{quantity}</span>
          <button
            className="px-3 py-2 hover:bg-secondary transition-colors"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <Button
        onClick={handleAdd}
        disabled={product.stock === 0}
        className="w-full h-12 bg-[#8B6914] hover:bg-[#7a5c12] text-white font-semibold text-base"
        size="lg"
      >
        <ShoppingCart size={18} className="mr-2" />
        {product.stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
      </Button>
    </div>
  )
}

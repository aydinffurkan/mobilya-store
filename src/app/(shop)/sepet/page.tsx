'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sepetiniz boş</h1>
        <p className="text-muted-foreground mb-6">Alışverişe başlamak için ürünlerimizi inceleyin.</p>
        <Link href="/urunler" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#8B6914] hover:bg-[#7a5c12] text-white text-sm font-medium transition-colors">
          Ürünleri Keşfet
        </Link>
      </div>
    )
  }

  const total = totalPrice()
  const shipping = 0 // free shipping
  const grandTotal = total + shipping

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sepetim ({items.length} ürün)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4 border border-border rounded-2xl bg-card">
              {/* Image */}
              <div className="w-24 h-24 rounded-xl bg-muted flex-shrink-0 relative overflow-hidden">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛋️</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                <h3 className="font-semibold text-sm leading-snug mt-0.5 line-clamp-2">{product.name}</h3>
                <p className="text-[#8B6914] font-bold mt-1">
                  {((product.sale_price ?? product.price) * quantity).toLocaleString('tr-TR')} ₺
                </p>
              </div>

              {/* Quantity + Delete */}
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(product.id, quantity - 1)}>
                    <Minus size={12} />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
                  <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(product.id, quantity + 1)}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="border border-border rounded-2xl p-5 bg-card sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">Sipariş Özeti</h2>
            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ürünler toplamı</span>
                <span>{total.toLocaleString('tr-TR')} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nakliye</span>
                <span className="text-green-600 font-medium">Ücretsiz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kurulum</span>
                <span className="text-green-600 font-medium">Ücretsiz</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Toplam</span>
              <span className="text-[#8B6914]">{grandTotal.toLocaleString('tr-TR')} ₺</span>
            </div>

            <Link href="/odeme" className="w-full h-12 inline-flex items-center justify-center rounded-lg bg-[#8B6914] hover:bg-[#7a5c12] text-white font-semibold text-base transition-colors">
              Ödemeye Geç
            </Link>

            <Link href="/urunler" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Alışverişe devam et
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

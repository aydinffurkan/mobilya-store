'use client'

import { useMemo, useState } from 'react'
import { ShoppingCart, Minus, Plus, Check, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { Product, ProductVariant, SelectedComponent } from '@/types'
import { toast } from 'sonner'

export default function ProductPurchasePanel({ product }: { product: Product }) {
  const activeVariants = (product.variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  const activeComponents = useMemo(
    () => (product.components ?? [])
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
    [product.components]
  )

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants.length > 0 ? activeVariants[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [componentQuantities, setComponentQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(activeComponents.map((c) => [c.id, c.default_quantity]))
  )
  const addItem = useCartStore((s) => s.addItem)

  const usesComponentPricing = activeComponents.length > 0

  const hasVariantPrice = selectedVariant?.price != null
  const basePrice = hasVariantPrice
    ? selectedVariant!.sale_price ?? selectedVariant!.price!
    : product.sale_price ?? product.price
  const originalPrice = hasVariantPrice
    ? (selectedVariant!.sale_price != null ? selectedVariant!.price : null)
    : (product.sale_price != null ? product.price : null)

  const componentsTotal = activeComponents.reduce((sum, c) => {
    const qty = componentQuantities[c.id] ?? c.default_quantity
    return sum + qty * c.unit_price
  }, 0)

  const totalSelectedComponents = activeComponents.reduce(
    (sum, c) => sum + (componentQuantities[c.id] ?? c.default_quantity),
    0
  )

  // Bu üründe özelleştirilebilir parça tanımlanmışsa fiyat ürünün kendi
  // fiyatı yerine seçili parçaların toplamından (birim fiyat × adet) hesaplanır.
  const displayPrice = usesComponentPricing ? componentsTotal : basePrice
  const discountPercent = !usesComponentPricing && originalPrice
    ? Math.round((1 - basePrice / originalPrice) * 100)
    : null

  const stock = selectedVariant ? selectedVariant.stock : product.stock

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  const setComponentQuantity = (component: typeof activeComponents[number], qty: number) => {
    const clamped = Math.min(component.max_quantity, Math.max(component.min_quantity, qty))
    setComponentQuantities((prev) => {
      const next = { ...prev, [component.id]: clamped }
      const total = activeComponents.reduce((sum, c) => sum + (next[c.id] ?? c.default_quantity), 0)
      if (total <= 0) {
        toast.error('En az bir parça seçili olmalı')
        return prev
      }
      return next
    })
  }

  const hasCustomContent = activeComponents.some(
    (c) => (componentQuantities[c.id] ?? c.default_quantity) !== c.default_quantity
  )

  const handleAdd = () => {
    const components: SelectedComponent[] | undefined = activeComponents.length > 0
      ? activeComponents.map((c) => ({
          component_id: c.id,
          name: c.name,
          quantity: componentQuantities[c.id] ?? c.default_quantity,
          unit_price: c.unit_price,
        }))
      : undefined

    addItem(product, quantity, selectedVariant ?? undefined, components)
    toast.success(`${product.name}${selectedVariant ? ` — ${selectedVariant.name}` : ''} sepete eklendi`, {
      description: `${quantity} adet${hasCustomContent ? ' · özelleştirilmiş içerik' : ''}`,
    })
  }

  return (
    <div className="space-y-4">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#8B6914]">
          {displayPrice.toLocaleString('tr-TR')} ₺
        </span>
        {originalPrice && (
          <span className="text-lg text-muted-foreground line-through">
            {originalPrice.toLocaleString('tr-TR')} ₺
          </span>
        )}
        {discountPercent !== null && discountPercent > 0 && (
          <span className="text-sm font-semibold text-red-500">-%{discountPercent}</span>
        )}
      </div>
      {usesComponentPricing && (
        <p className="text-xs text-muted-foreground -mt-2">
          Bu ürünün fiyatı, aşağıda seçtiğiniz parçaların toplamı olarak hesaplanır.
        </p>
      )}

      {/* Variant picker */}
      {activeVariants.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Seçenek:</span>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isSelected
                      ? 'border-[#8B6914] bg-[#8B6914]/10 text-[#8B6914] font-medium'
                      : 'border-border hover:border-[#8B6914]/50'
                  }`}
                >
                  {isSelected && <Check size={14} />}
                  {variant.name}
                  {variant.stock === 0 && <span className="text-xs text-red-500">(Stokta yok)</span>}
                </button>
              )
            })}
          </div>
          {selectedVariant && Object.keys(selectedVariant.attributes ?? {}).length > 0 && (
            <p className="text-xs text-muted-foreground">
              {Object.entries(selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Content customization */}
      {activeComponents.length > 0 && (
        <div className="space-y-2.5 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-[#8B6914]" />
            <span className="text-sm font-semibold">İçeriği Özelleştir</span>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Bu ürün birden fazla parçadan oluşur. Dilediğiniz parçanın adedini değiştirebilir veya kaldırabilirsiniz; ürün fiyatı seçtiklerinizin toplamı olarak güncellenir.
          </p>
          <div className="space-y-2">
            {activeComponents.map((component) => {
              const qty = componentQuantities[component.id] ?? component.default_quantity
              const lineTotal = qty * component.unit_price
              return (
                <div key={component.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-secondary/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{component.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Birim: {component.unit_price.toLocaleString('tr-TR')} ₺
                      {qty > 0 && (
                        <span className="text-[#8B6914] font-medium">
                          {' · '}{lineTotal.toLocaleString('tr-TR')} ₺ ({qty} adet)
                        </span>
                      )}
                      {qty === 0 && <span>{' · '}seçili değil</span>}
                    </p>
                  </div>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 hover:bg-secondary transition-colors disabled:opacity-30"
                      onClick={() => setComponentQuantity(component, qty - 1)}
                      disabled={qty <= component.min_quantity || totalSelectedComponents <= 1}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">{qty}</span>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 hover:bg-secondary transition-colors disabled:opacity-30"
                      onClick={() => setComponentQuantity(component, qty + 1)}
                      disabled={qty >= component.max_quantity}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stock */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{stock > 0 ? `Stokta var (${stock} adet)` : 'Stokta yok'}</span>
      </div>

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
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Add to cart */}
      <Button
        onClick={handleAdd}
        disabled={stock === 0}
        className="w-full h-12 bg-[#8B6914] hover:bg-[#7a5c12] text-white font-semibold text-base"
        size="lg"
      >
        <ShoppingCart size={18} className="mr-2" />
        {stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
      </Button>
    </div>
  )
}

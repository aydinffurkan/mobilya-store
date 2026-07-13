'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, TrendingDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCartPreviewStore } from '@/store/cartPreviewStore'
import { Product, ProductVariant, SelectedComponent } from '@/types'
import FavoriteButton from '@/components/products/FavoriteButton'

interface Props {
  product: Product
  componentQuantities: Record<string, number>
  onChangeComponents: () => void
}

export default function ProductPurchasePanel({ product, componentQuantities, onChangeComponents }: Props) {
  const activeVariants = (product.variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  const activeComponents = useMemo(
    () =>
      (product.components ?? [])
        .filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [product.components]
  )

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants.length > 0 ? activeVariants[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [showSticky, setShowSticky] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const addItem = useCartStore((s) => s.addItem)
  const showPreview = useCartPreviewStore((s) => s.show)

  useEffect(() => {
    const el = addButtonRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const usesComponentPricing = activeComponents.length > 0

  const hasVariantPrice = selectedVariant?.price != null
  const basePrice = hasVariantPrice
    ? (selectedVariant!.sale_price ?? selectedVariant!.price!)
    : (product.sale_price ?? product.price)
  const originalPrice = hasVariantPrice
    ? selectedVariant!.sale_price != null ? selectedVariant!.price : null
    : product.sale_price != null ? product.price : null

  const componentsTotal = activeComponents.reduce((sum, c) => {
    const qty = componentQuantities[c.id] ?? c.default_quantity
    return sum + qty * c.unit_price
  }, 0)

  const displayPrice = usesComponentPricing ? componentsTotal : basePrice
  const discountPercent =
    !usesComponentPricing && originalPrice
      ? Math.round((1 - basePrice / originalPrice) * 100)
      : null

  const cartDiscountPct = !hasVariantPrice && !usesComponentPricing
    ? product.cart_discount_percent
    : null
  const cartPrice = cartDiscountPct
    ? Math.round(basePrice * (1 - cartDiscountPct / 100))
    : null
  const hasAnyDiscount = !!originalPrice || !!cartDiscountPct

  const stock = selectedVariant ? selectedVariant.stock : product.stock

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  const handleAdd = () => {
    const components: SelectedComponent[] | undefined =
      activeComponents.length > 0
        ? activeComponents
            .filter((c) => (componentQuantities[c.id] ?? c.default_quantity) > 0)
            .map((c) => ({
              component_id: c.id,
              name: c.name,
              quantity: componentQuantities[c.id] ?? c.default_quantity,
              unit_price: c.unit_price,
            }))
        : undefined

    addItem(product, quantity, selectedVariant ?? undefined, components)
    showPreview({ product, variant: selectedVariant, quantity, unitPrice: displayPrice })
  }

  const selectedComponents = activeComponents.filter(
    (c) => (componentQuantities[c.id] ?? c.default_quantity) > 0
  )

  return (
    <div className="space-y-6">

      {/* Fiyat */}
      <div className="border-b border-neutral-100 pb-5 space-y-3">

        {/* Normal fiyat üstü çizili + indirimli fiyat */}
        <div className="space-y-1">
          {originalPrice && !usesComponentPricing ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-neutral-400 font-light line-through">
                  {originalPrice.toLocaleString('tr-TR')} ₺
                </span>
                {discountPercent !== null && discountPercent > 0 && (
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                    -%{discountPercent}
                  </span>
                )}
              </div>
              <span className="text-3xl font-light tracking-wide text-neutral-900 block">
                {displayPrice.toLocaleString('tr-TR')} ₺
              </span>
            </>
          ) : (
            <span className="text-3xl font-light tracking-wide text-neutral-900 block">
              {displayPrice.toLocaleString('tr-TR')} ₺
            </span>
          )}

          {/* Sepette indirim */}
          {cartDiscountPct && cartPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                Sepette %{cartDiscountPct} İndirim
              </span>
              <span className="text-base font-medium text-amber-700">
                → {cartPrice.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          )}
        </div>

        {/* Son 30 günün en düşük fiyatı rozeti */}
        {hasAnyDiscount && (
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5">
            <TrendingDown size={12} className="flex-shrink-0" />
            Son 30 Günün En Düşük Fiyatı
          </div>
        )}

        {/* Taksit + hızlı teslimat */}
        {product.installment_count && !usesComponentPricing && (
          <p className="text-xs text-neutral-500 font-light">
            {product.installment_count} taksit ile {(displayPrice / product.installment_count).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺/ay
          </p>
        )}
        {product.fast_delivery && (
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" /> Hızlı Teslimat
          </p>
        )}
      </div>

      {/* Varyant seçimi */}
      {activeVariants.length > 0 && (
        <div className="space-y-3">
          <span className="text-[11px] tracking-wider text-neutral-500 font-medium uppercase block">
            Seçenek
          </span>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => v.stock > 0 && selectVariant(v)}
                className={`relative px-4 py-2 text-sm font-light border overflow-hidden transition-all duration-150 rounded-sm ${
                  selectedVariant?.id === v.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : v.stock === 0
                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'
                }`}
              >
                {v.name}
                {v.stock === 0 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <line x1="5" y1="95" x2="95" y2="5" stroke="#d1d5db" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          {selectedVariant && Object.keys(selectedVariant.attributes ?? {}).length > 0 && (
            <p className="text-xs text-neutral-400 font-light">
              {Object.entries(selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Takım içeriği özeti */}
      {activeComponents.length > 0 && (
        <div className="border border-neutral-100 rounded-sm text-xs">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="font-semibold tracking-wider text-neutral-700 uppercase">
              Takım İçeriği
            </span>
            <button
              type="button"
              onClick={onChangeComponents}
              className="font-medium text-amber-700 hover:underline tracking-wide uppercase"
            >
              Değiştir
            </button>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {selectedComponents.map((c) => {
              const qty = componentQuantities[c.id] ?? c.default_quantity
              return (
                <div key={c.id} className="flex items-center justify-between gap-4">
                  <span className="text-neutral-600 font-light truncate">{c.name}</span>
                  <span className="text-neutral-800 font-light tabular-nums flex-shrink-0">
                    {qty} × {c.unit_price.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              )
            })}
            {selectedComponents.length === 0 && (
              <p className="text-neutral-400 font-light italic">Hiçbir parça seçilmedi</p>
            )}
          </div>
          <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="font-medium text-neutral-700">Toplam</span>
            <span className="font-semibold text-neutral-900 tabular-nums">
              {componentsTotal.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>
      )}

      {/* Stok */}
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          stock === 0 ? 'bg-red-400' : stock <= 3 ? 'bg-amber-400' : 'bg-green-400'
        }`} />
        <span className={`text-xs font-light tracking-wide ${
          stock === 0 ? 'text-red-500' : stock <= 3 ? 'text-amber-600 font-medium' : 'text-neutral-500'
        }`}>
          {stock === 0
            ? 'Stokta yok'
            : stock <= 3
            ? `Son ${stock} adet kaldı!`
            : 'Stokta mevcut'}
        </span>
      </div>

      {/* Adet */}
      <div className="flex items-center gap-5">
        <span className="text-[11px] tracking-wider text-neutral-500 font-medium uppercase">Adet</span>
        <div className="flex items-center border border-neutral-200 rounded-sm">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-25"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus size={12} />
          </button>
          <span className="w-12 h-9 flex items-center justify-center text-sm font-light border-l border-r border-neutral-200">
            {quantity}
          </span>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-25"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            disabled={quantity >= stock}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Sepete Ekle + Favori */}
      <div className="flex gap-3 pt-1">
        <button
          ref={addButtonRef}
          onClick={handleAdd}
          disabled={stock === 0}
          className="flex-1 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs tracking-widest font-medium py-4 uppercase rounded-sm transition-colors duration-200"
        >
          {stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
        </button>
        <div className="border border-neutral-200 hover:border-red-200 rounded-sm flex items-center justify-center px-4 transition-colors">
          <FavoriteButton productId={product.id} size={20} className="bg-transparent shadow-none p-0" />
        </div>
      </div>

      {/* Sticky mobile CTA — sadece "Sepete Ekle" görünmez olduğunda */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-neutral-100 px-4 py-3 flex items-center gap-3 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-neutral-400 font-light truncate">{product.name}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-base font-light text-neutral-900 leading-tight">
                {displayPrice.toLocaleString('tr-TR')} ₺
              </p>
              {cartPrice && (
                <p className="text-xs text-amber-700 font-medium">
                  → Sepette: {cartPrice.toLocaleString('tr-TR')} ₺
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={stock === 0}
            className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs tracking-widest font-medium px-6 py-3.5 uppercase rounded-sm transition-colors duration-200 flex-shrink-0"
          >
            {stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
          </button>
        </div>
      )}

    </div>
  )
}
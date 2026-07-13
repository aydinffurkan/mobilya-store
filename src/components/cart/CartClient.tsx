'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, Tag, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { useCartStore, itemKey } from '@/store/cartStore'
import { useCouponStore } from '@/store/couponStore'
import { validateCoupon } from '@/app/(shop)/sepet/actions'
import { Separator } from '@/components/ui/separator'
import { cartDiscountTextColor, cartDiscountBadgeColors } from '@/lib/utils/cartDiscount'

function CouponSection({ subtotal }: { subtotal: number }) {
  const { code, type, value, apply, clear } = useCouponStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const discount = useCouponStore((s) => s.discountAmount(subtotal))

  const handleApply = () => {
    if (!input.trim()) return
    setError('')
    startTransition(async () => {
      const result = await validateCoupon(input, subtotal)
      if (result.valid) {
        apply(result.code!, result.type!, result.value!, result.minAmount ?? 0)
        setInput('')
      } else {
        setError(result.error ?? 'Geçersiz kupon kodu')
      }
    })
  }

  if (code) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <Tag size={13} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-700">{code}</span>
            <span className="text-xs text-green-500 flex-shrink-0">
              {type === 'percent' ? `-%${value}` : `-${value!.toLocaleString('tr-TR')} ₺`}
            </span>
          </div>
          <button onClick={clear} className="text-green-400 hover:text-green-700 transition-colors flex-shrink-0 ml-2" aria-label="Kuponu kaldır">
            <X size={15} />
          </button>
        </div>
        <div className="flex justify-between text-sm font-medium text-green-600">
          <span>Kupon indirimi</span>
          <span>-{discount.toLocaleString('tr-TR')} ₺</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="İndirim kodu"
          disabled={isPending}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222]/20 bg-background disabled:opacity-50"
        />
        <button
          onClick={handleApply}
          disabled={!input.trim() || isPending}
          className="px-4 py-2 text-sm font-semibold bg-[#222222] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 flex-shrink-0"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Uygula
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X size={11} /> {error}
        </p>
      )}
    </div>
  )
}

export default function CartClient() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const [savingsExpanded, setSavingsExpanded] = useState(true)

  const originalTotal = items.reduce((sum, i) => {
    const base = i.components && i.components.length > 0
      ? i.components.reduce((cSum, c) => cSum + c.quantity * c.unit_price, 0)
      : i.variant?.price != null
        ? (i.variant.sale_price ?? i.variant.price)
        : (i.product.sale_price ?? i.product.price)
    return sum + base * i.quantity
  }, 0)

  const total = totalPrice()
  const cartDiscountSaving = originalTotal - total
  const discount = useCouponStore((s) => s.discountAmount(total))

  // Her yüzde için ayrı tasarruf hesabı
  const savingsByPct = new Map<number, number>()
  for (const { product, quantity, variant, components } of items) {
    const pct = product.cart_discount_percent
    if (!pct) continue
    const base = components && components.length > 0
      ? components.reduce((s, c) => s + c.quantity * c.unit_price, 0)
      : variant?.price != null
        ? (variant.sale_price ?? variant.price)
        : (product.sale_price ?? product.price)
    const unitPrice = Math.round(base * (1 - pct / 100))
    const saving = (base - unitPrice) * quantity
    savingsByPct.set(pct, (savingsByPct.get(pct) ?? 0) + saving)
  }
  const sortedSavings = [...savingsByPct.entries()].sort((a, b) => b[0] - a[0])

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={56} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sepetiniz boş</h1>
        <p className="text-muted-foreground mb-6">Alışverişe başlamak için ürünlerimizi inceleyin.</p>
        <Link href="/urunler" className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white text-sm font-semibold transition-colors">
          Ürünleri Keşfet
        </Link>
      </div>
    )
  }

  const shipping = 0
  const grandTotal = total - discount + shipping

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sepetim ({items.length} ürün)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ürünler */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity, variant, components }) => {
            const basePrice = components && components.length > 0
              ? components.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
              : variant?.price != null
                ? (variant.sale_price ?? variant.price)
                : (product.sale_price ?? product.price)
            const cartPct = product.cart_discount_percent
            const unitPrice = cartPct ? Math.round(basePrice * (1 - cartPct / 100)) : basePrice
            return (
              <div key={itemKey(product.id, variant?.id, components)} className="flex gap-3 p-3 sm:gap-4 sm:p-4 border border-border rounded-2xl bg-card">
                <Link href={`/urunler/${product.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted flex-shrink-0 relative overflow-hidden hover:opacity-90 transition-opacity">
                  {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛋️</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                  <h3 className="font-semibold text-sm leading-snug mt-0.5 line-clamp-2">{product.name}</h3>
                  {variant && <p className="text-xs text-muted-foreground mt-0.5">{variant.name}</p>}
                  {components && components.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {components.map((c) => `${c.name} × ${c.quantity}`).join(' · ')}
                    </p>
                  )}
                  {cartPct ? (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${cartDiscountBadgeColors(cartPct)}`}>
                        Sepette -%{cartPct}
                      </span>
                      <span className={`font-bold ${cartDiscountTextColor(cartPct)}`}>
                        {(unitPrice * quantity).toLocaleString('tr-TR')} ₺
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {(basePrice * quantity).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  ) : (
                    <p className="text-[#222222] font-bold mt-1">
                      {(unitPrice * quantity).toLocaleString('tr-TR')} ₺
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(product.id, variant?.id, components)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(product.id, quantity - 1, variant?.id, components)}>
                      <Minus size={12} />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
                    <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(product.id, quantity + 1, variant?.id, components)}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sipariş Özeti */}
        <div>
          <div className="border border-border rounded-2xl p-5 bg-card sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">Sipariş Özeti</h2>
            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ürünler toplamı</span>
                <span>{originalTotal.toLocaleString('tr-TR')} ₺</span>
              </div>
              {cartDiscountSaving > 0 && (
                <>
                  <div className="flex justify-between font-medium text-[#222222]">
                    <button
                      onClick={() => setSavingsExpanded((v) => !v)}
                      className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      <span>Promosyon İndirimi</span>
                      {savingsExpanded
                        ? <ChevronUp size={13} className="text-neutral-500" />
                        : <ChevronDown size={13} className="text-neutral-500" />}
                    </button>
                    <span>-{cartDiscountSaving.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  {savingsExpanded && sortedSavings.map(([pct, saving]) => (
                    <div key={pct} className={`flex justify-between text-sm font-medium pl-2 ${cartDiscountTextColor(pct)}`}>
                      <span>Sepette %{pct} İndirim!</span>
                      <span>-{saving.toLocaleString('tr-TR')} ₺</span>
                    </div>
                  ))}
                </>
              )}
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
            <CouponSection subtotal={total} />
            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Toplam</span>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-xs font-normal text-muted-foreground line-through mb-0.5">
                    {total.toLocaleString('tr-TR')} ₺
                  </p>
                )}
                <span className="text-[#222222]">{grandTotal.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>

            {(cartDiscountSaving > 0 || discount > 0) && (
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-600 text-sm font-semibold">
                <Tag size={14} />
                Toplam {(cartDiscountSaving + discount).toLocaleString('tr-TR')} ₺ tasarruf ettiniz!
              </div>
            )}

            <Link href="/odeme" className="w-full h-12 inline-flex items-center justify-center rounded-lg bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white font-semibold text-base transition-colors">
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

'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { CategoryProductTab } from '@/lib/repositories/products'
import { useCartStore } from '@/store/cartStore'
import { useCartPreviewStore } from '@/store/cartPreviewStore'
import FavoriteButton from '@/components/products/FavoriteButton'
import { cartDiscountGradient, cartDiscountTextColor } from '@/lib/utils/cartDiscount'

interface Props {
  tabs: CategoryProductTab[]
}

export default function ProductTabsCarousel({ tabs }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDown = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const hasDragged = useRef(false)

  const activeTab = tabs[activeIndex]

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollRef.current) return
    isDown.current = true
    hasDragged.current = false
    startX.current = e.clientX
    startScrollLeft.current = scrollRef.current.scrollLeft
    setIsDragging(true)
    scrollRef.current.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDown.current || !scrollRef.current) return
    e.preventDefault()
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > 4) hasDragged.current = true
    scrollRef.current.scrollLeft = startScrollLeft.current - delta
  }

  const endDrag = (e: React.PointerEvent) => {
    if (!isDown.current) return
    isDown.current = false
    setIsDragging(false)
    if (scrollRef.current?.hasPointerCapture(e.pointerId)) {
      scrollRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div>
      {/* Sekmeler */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-1 flex-wrap mb-8 border-b border-neutral-100">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveIndex(i)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                i === activeIndex ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.name}
              {i === activeIndex && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-[#222222]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className={`flex gap-4 overflow-x-auto pb-2 pl-4 sm:pl-6 lg:pl-8 [&::-webkit-scrollbar]:hidden select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab scroll-smooth'
          }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {activeTab.products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[240px] sm:w-[280px]">
              <CarouselCard product={product} />
            </div>
          ))}
          <div className="flex-shrink-0 w-2" />
        </div>

        {activeTab.products.length > 4 && (
          <>
            <button
              onClick={() => scroll(-1)}
              className="hidden md:flex absolute left-2 top-[38%] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-neutral-600 hover:text-[#222222] hover:border-[#222222]/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="hidden md:flex absolute right-2 top-[38%] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-neutral-600 hover:text-[#222222] hover:border-[#222222]/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Kart: ProductCard ile aynı görsel dil ─────────────────────────────────────

function CarouselCard({ product }: { product: CategoryProductTab['products'][number] }) {
  const addItem     = useCartStore((s) => s.addItem)
  const showPreview = useCartPreviewStore((s) => s.show)

  const images      = (product.images ?? []).filter(Boolean)
  const count       = Math.min(images.length, 6)
  const hasMultiple = count > 1

  const [idx,        setIdx]        = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const cartDiscountPct = product.cart_discount_percent ?? null
  const saleDiscountPct = !cartDiscountPct && product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : null
  const basePrice    = product.sale_price ?? product.price
  const cartPrice    = cartDiscountPct ? Math.round(basePrice * (1 - cartDiscountPct / 100)) : null
  const displayPrice = cartPrice ?? product.sale_price ?? product.price

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasMultiple) return
    const rect = e.currentTarget.getBoundingClientRect()
    setIdx(Math.min(Math.floor(((e.clientX - rect.left) / rect.width) * count), count - 1))
  }, [hasMultiple, count])

  const handleMouseLeave = useCallback(() => setIdx(0), [])

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40)
      setIdx((i) => diff > 0 ? Math.min(i + 1, count - 1) : Math.max(i - 1, 0))
    setTouchStart(null)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
    showPreview({ product, variant: undefined, quantity: 1, unitPrice: displayPrice })
  }

  return (
    <Link href={`/urunler/${product.slug}`} className="group block">

      {/* Görsel */}
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F8F8F6]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 ? (
          images.slice(0, 6).map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-200 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={src}
                alt={`${product.name} — ${i + 1}`}
                fill
                quality={95}
                className="object-cover"
                sizes="280px"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-sm">Görsel Yok</div>
        )}

        {/* Sepette İndirim rozeti */}
        {cartDiscountPct && (
          <div className={`absolute top-2 left-2 z-10 w-[62px] h-[62px] rounded-full bg-gradient-to-br ${cartDiscountGradient(cartDiscountPct)} shadow-lg ring-2 ring-white/40 flex flex-col items-center justify-center select-none gap-[1px]`}>
            <span className="text-white font-bold text-[7.5px] tracking-wide uppercase leading-none">Sepette</span>
            <span className="text-white font-black text-[18px] leading-tight">%{cartDiscountPct}</span>
            <span className="text-white font-bold text-[7.5px] tracking-wide uppercase leading-none">İndirim</span>
          </div>
        )}

        {/* Sale rozeti */}
        {saleDiscountPct && !cartDiscountPct && (
          <div className="absolute top-2 left-2 z-10 w-[50px] h-[50px] rounded-full bg-red-500 shadow-md ring-2 ring-white/40 flex flex-col items-center justify-center select-none">
            <span className="text-white font-black text-[15px] leading-none">-{saleDiscountPct}</span>
            <span className="text-white/90 font-bold text-[11px] leading-none">%</span>
          </div>
        )}

        {/* Tükendi + diğerleri */}
        <div className={`absolute left-2.5 flex flex-col gap-1.5 z-10 ${(cartDiscountPct || saleDiscountPct) ? 'top-[70px]' : 'top-2.5'}`}>
          {product.stock <= 0 && (
            <span className="bg-neutral-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
              Tükendi
            </span>
          )}
        </div>

        {/* Favori */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton productId={product.id} />
        </div>

        {/* Nokta göstergeler */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-[5px] z-10">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? 'w-4 h-[3px] bg-white' : 'w-[3px] h-[3px] bg-white/55'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="pt-3 pb-1 space-y-1">
        {product.category?.name && (
          <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider font-medium truncate">
            {product.category.name}
          </p>
        )}
        <h3 className="text-[13px] font-semibold text-neutral-800 leading-snug line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="min-w-0">
            {cartDiscountPct ? (
              <div>
                <span className="text-[15px] text-neutral-400 line-through leading-none">
                  {basePrice.toLocaleString('tr-TR')} ₺
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-[15px] font-black ${cartDiscountTextColor(cartDiscountPct!)} leading-none`}>Sepette:</span>
                  <span className={`text-[15px] font-black ${cartDiscountTextColor(cartDiscountPct!)} leading-none`}>
                    {cartPrice!.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>
            ) : product.sale_price ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[15px] font-bold text-[#222222]">
                  {product.sale_price.toLocaleString('tr-TR')} ₺
                </span>
                <span className="text-[12px] text-neutral-400 line-through leading-none">
                  {product.price.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-bold text-[#222222]">
                {product.price.toLocaleString('tr-TR')} ₺
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            aria-label="Sepete ekle"
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#222222]/10 text-[#222222] flex items-center justify-center hover:bg-[#222222] hover:text-white transition-colors duration-150 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </Link>
  )
}

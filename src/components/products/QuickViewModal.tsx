'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  X, Minus, Plus, ShoppingCart, ExternalLink,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useQuickViewStore } from '@/store/quickViewStore'
import { useCartStore } from '@/store/cartStore'
import { useCartPreviewStore } from '@/store/cartPreviewStore'
import { Product, ProductVariant } from '@/types'

export default function QuickViewModal() {
  const { product, close } = useQuickViewStore()
  const addItem = useCartStore((s) => s.addItem)
  const showPreview = useCartPreviewStore((s) => s.show)

  const [display, setDisplay] = useState<Product | null>(null)
  const [visible, setVisible] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (product) {
      setDisplay(product)
      setActiveImg(0)
      setQty(1)
      const actives = (product.variants ?? []).filter((v) => v.is_active)
      setSelectedVariant(actives.length > 0 ? actives[0] : null)
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      const t = setTimeout(() => setDisplay(null), 300)
      return () => clearTimeout(t)
    }
  }, [product])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    document.body.style.overflow = product ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [product])

  if (!display) return null

  const images = display.images?.length ? display.images : []
  const activeVariants = (display.variants ?? []).filter((v) => v.is_active)
  const hasComponents = (display.components ?? []).filter((c) => c.is_active).length > 0

  const hasVariantPrice = selectedVariant?.price != null
  const basePrice = hasVariantPrice
    ? (selectedVariant!.sale_price ?? selectedVariant!.price!)
    : (display.sale_price ?? display.price)
  const originalPrice = hasVariantPrice
    ? (selectedVariant!.sale_price != null ? selectedVariant!.price : null)
    : (display.sale_price != null ? display.price : null)
  const discountPercent = originalPrice
    ? Math.round((1 - basePrice / originalPrice) * 100)
    : null
  const stock = selectedVariant ? selectedVariant.stock : display.stock

  const handleAdd = () => {
    addItem(display, qty, selectedVariant ?? undefined)
    showPreview({ product: display, variant: selectedVariant, quantity: qty, unitPrice: basePrice })
    close()
  }

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Kapat */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 hover:bg-neutral-100 transition-colors shadow-sm"
          aria-label="Kapat"
        >
          <X size={18} className="text-neutral-600" />
        </button>

        {/* Sol: Resim galerisi */}
        <div className="md:w-[45%] flex-shrink-0 bg-neutral-50 flex flex-col">
          <div className="relative aspect-[4/3] md:aspect-square overflow-hidden">
            {images.length > 0 ? (
              <Image
                src={images[activeImg]}
                alt={display.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                Görsel Yok
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-1.5 p-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImg === i ? 'border-[#222222]' : 'border-transparent hover:border-neutral-300'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Detaylar */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            {display.category && (
              <p className="text-xs text-[#222222] font-medium uppercase tracking-wider mb-1">
                {display.category.name}
              </p>
            )}
            <h2 className="text-lg font-bold text-neutral-900 leading-snug">{display.name}</h2>
          </div>

          {/* Fiyat */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-[#222222]">
              {basePrice.toLocaleString('tr-TR')} ₺
            </span>
            {originalPrice && (
              <span className="text-sm text-neutral-400 line-through">
                {originalPrice.toLocaleString('tr-TR')} ₺
              </span>
            )}
            {discountPercent && discountPercent > 0 && (
              <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                -%{discountPercent}
              </span>
            )}
          </div>

          {/* Varyantlar */}
          {activeVariants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Seçenek:</p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      selectedVariant?.id === v.id
                        ? 'border-[#222222] bg-[#222222]/10 text-[#222222] font-medium'
                        : 'border-neutral-200 hover:bg-[#C8B8A6] hover:border-[#C8B8A6] text-neutral-700 hover:text-[#222222]'
                    }`}
                  >
                    {v.name}
                    {v.stock === 0 && (
                      <span className="text-xs text-red-400 ml-1">(Yok)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parça özelleştirme uyarısı */}
          {hasComponents && (
            <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
              Bu ürün özelleştirilebilir parçalar içerir. Tüm seçenekler için ürün sayfasını ziyaret edin.
            </p>
          )}

          {/* Stok */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-neutral-600">
              {stock > 0 ? `Stokta var (${stock} adet)` : 'Stokta yok'}
            </span>
          </div>

          {/* Adet + Sepete Ekle */}
          <div className="flex items-center gap-3 mt-auto pt-2">
            <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
              <button
                className="px-3 py-2.5 hover:bg-neutral-100 transition-colors disabled:opacity-30"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">{qty}</span>
              <button
                className="px-3 py-2.5 hover:bg-neutral-100 transition-colors disabled:opacity-30"
                onClick={() => setQty(Math.min(stock, qty + 1))}
                disabled={qty >= stock}
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={stock === 0}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#222222] hover:bg-[#222222] hover:opacity-90 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
            >
              <ShoppingCart size={16} />
              {stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
            </button>
          </div>

          {/* Tam ürün linki */}
          <Link
            href={`/urunler/${display.slug}`}
            onClick={close}
            className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 transition-colors border border-neutral-200 rounded-lg py-2.5 hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222]"
          >
            <ExternalLink size={14} />
            Tüm Ürün Detaylarını Gör
          </Link>
        </div>
      </div>
    </div>
  )
}
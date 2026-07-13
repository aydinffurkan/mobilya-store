'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, X, TrendingDown } from 'lucide-react'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useCartPreviewStore } from '@/store/cartPreviewStore'
import FavoriteButton from '@/components/products/FavoriteButton'
import { cartDiscountGradient, cartDiscountTextColor } from '@/lib/utils/cartDiscount'

/* ── Renk haritası (Türkçe isim → hex) ─────────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  siyah: '#1a1a1a', beyaz: '#f5f5f0', gri: '#9e9e9e', antrasit: '#3d4145',
  'koyu gri': '#555', 'açık gri': '#d0cec9', bej: '#c8b8a6', krem: '#f0ece4',
  kahve: '#7d5c45', 'koyu kahve': '#3e2723', ceviz: '#5d4037', meşe: '#8d6e63',
  lacivert: '#1a2a4a', mavi: '#1565c0', 'açık mavi': '#4fc3f7',
  kırmızı: '#c62828', bordo: '#6d1a1a', pembe: '#e91e63', mor: '#6a1b9a',
  yeşil: '#2e7d32', 'koyu yeşil': '#1b5e20', sarı: '#f9a825', turuncu: '#e65100',
  gold: '#c8a96e', gümüş: '#b0bec5', doğal: '#d7ccc8', naturel: '#d7ccc8',
  bakır: '#b07c50', füme: '#5a5a5a',
}

function resolveColor(raw: string): { bg: string; known: boolean } {
  const key = raw.trim().toLowerCase()
  if (key.startsWith('#')) return { bg: key, known: true }
  const mapped = COLOR_MAP[key]
  // Kısmi eşleşme: "koyu mavi" → "lacivert" gibi içeren anahtar dene
  if (!mapped) {
    const partialKey = Object.keys(COLOR_MAP).find((k) => key.includes(k) || k.includes(key))
    if (partialKey) return { bg: COLOR_MAP[partialKey], known: true }
  }
  return { bg: mapped ?? '#d0cec9', known: !!mapped }
}

/* Attribute key'i renk mi? (renk, rengi, rengini, renkler, color, colour...) */
function isColorKey(key: string) {
  const k = key.toLowerCase()
  return k.includes('renk') || k.includes('reng') || k.includes('color') || k.includes('colour')
}

/* Varyantlardan aktif renk listesi çıkar */
function extractColors(variants: Product['variants']): string[] {
  if (!variants?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of variants) {
    if (!v.is_active) continue
    const attrs = v.attributes ?? {}

    // 1. Renk içeren key varsa önce onu dene
    const colorEntry = Object.entries(attrs).find(([key]) => isColorKey(key))
    // 2. Yoksa ilk attribute'u al (tek attribute genellikle renktir)
    const fallbackEntry = Object.entries(attrs)[0]
    const raw = (colorEntry ?? fallbackEntry)?.[1]?.trim() ?? ''

    if (!raw || seen.has(raw)) continue
    seen.add(raw)
    out.push(raw)
  }
  return out
}

/* ── Bileşen ────────────────────────────────────────────────────────────────── */
export default function ProductCard({ product }: { product: Product }) {
  const addItem     = useCartStore((s) => s.addItem)
  const showPreview = useCartPreviewStore((s) => s.show)

  const images      = (product.images ?? []).filter(Boolean)
  const count       = Math.min(images.length, 6)
  const hasMultiple = count > 1

  const [idx,               setIdx]               = useState(0)
  const [touchStart,        setTouchStart]        = useState<number | null>(null)
  const [showVariantPicker, setShowVariantPicker] = useState(false)

  const activeVariants = (product.variants ?? []).filter((v) => v.is_active)

  useEffect(() => {
    if (!showVariantPicker) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowVariantPicker(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showVariantPicker])

  const sold     = product.stock <= 0
  const lowStock = !sold && product.stock <= 5

  const cartDiscountPct = product.cart_discount_percent ?? null

  const saleDiscountPct = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : null

  const basePrice   = product.sale_price ?? product.price
  const cartPrice   = cartDiscountPct ? Math.round(basePrice * (1 - cartDiscountPct / 100)) : null
  const displayPrice = cartPrice ?? product.sale_price ?? product.price

  const colors = extractColors(product.variants)

  /* ── Fare pozisyonu → görsel indeksi ── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasMultiple) return
    const rect = e.currentTarget.getBoundingClientRect()
    setIdx(Math.min(Math.floor(((e.clientX - rect.left) / rect.width) * count), count - 1))
  }, [hasMultiple, count])

  const handleMouseLeave = useCallback(() => setIdx(0), [])

  /* ── Dokunmatik kaydırma ── */
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
    if (sold) return
    addItem(product)
    showPreview({ product, variant: undefined, quantity: 1, unitPrice: displayPrice })
  }

  return (
  <>
    <Link
      href={`/urunler/${product.slug}`}
      className="group block hover:-translate-y-0.5 transition-transform duration-300"
    >
      {/* ── Görsel ───────────────────────────────────── */}
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F8F8F6]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Görseller — zoom on hover */}
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
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-sm">
            Görsel Yok
          </div>
        )}

        {/* Tükendi karartma */}
        {sold && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <span className="bg-neutral-800/85 text-white text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-full">
              Tükendi
            </span>
          </div>
        )}

        {/* Sepette İndirim rozeti — büyük yuvarlak */}
        {cartDiscountPct && (
          <div className={`absolute top-2 left-2 z-10 w-[62px] h-[62px] rounded-full bg-gradient-to-br ${cartDiscountGradient(cartDiscountPct)} shadow-lg ring-2 ring-white/40 flex flex-col items-center justify-center select-none gap-[1px]`}>
            <span className="text-white font-bold text-[7.5px] tracking-wide uppercase leading-none">Sepette</span>
            <span className="text-white font-black text-[18px] leading-tight">%{cartDiscountPct}</span>
            <span className="text-white font-bold text-[7.5px] tracking-wide uppercase leading-none">İndirim</span>
          </div>
        )}

        {/* Sale rozeti — sağ üst köşe */}
        {!!saleDiscountPct && (
          <div className="absolute top-2 right-2 z-10 w-[50px] h-[50px] rounded-full bg-red-500 shadow-md ring-2 ring-white/40 flex flex-col items-center justify-center select-none">
            <span className="text-white font-black text-[15px] leading-none">-{saleDiscountPct}</span>
            <span className="text-white/90 font-bold text-[11px] leading-none">%</span>
          </div>
        )}

        {/* Diğer rozetler */}
        <div className={`absolute left-2.5 flex flex-col gap-1.5 z-10 ${cartDiscountPct ? 'top-[70px]' : 'top-2.5'}`}>
          {product.is_featured && !cartDiscountPct && !saleDiscountPct && (
            <span className="bg-[#222222] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
              Öne Çıkan
            </span>
          )}
          {product.fast_delivery && (
            <span className="bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
              Hızlı Teslimat
            </span>
          )}
        </div>

        {/* Nokta göstergeler */}
        {hasMultiple && (
          <div className="absolute bottom-[52px] inset-x-0 flex justify-center gap-[5px] z-10 pointer-events-none">
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

        {/* Sepete Ekle — hover'da slide-up (desktop) */}
        {!sold && (
          <div className="absolute inset-x-0 bottom-0 p-2 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-[#222222]/90 hover:bg-[#222222] hover:opacity-90 backdrop-blur-sm text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors"
            >
              <ShoppingCart size={13} strokeWidth={2} />
              Sepete Ekle
            </button>
          </div>
        )}
      </div>

      {/* ── Bilgi ────────────────────────────────────── */}
      <div className="pt-3 pb-1 space-y-1.5">

        <div className="flex items-center justify-between gap-2">
          {product.category?.name ? (
            <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider font-medium truncate">
              {product.category.name}
            </p>
          ) : <span />}
          <FavoriteButton productId={product.id} />
        </div>

        <h3 className="text-[13px] font-semibold text-neutral-800 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Düşük stok uyarısı */}
        {lowStock && (
          <p className="text-[10.5px] text-red-500 font-medium leading-tight">
            Son {product.stock} ürün!
          </p>
        )}

        {/* Fiyat + mobil sepet butonu */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="min-w-0 space-y-0.5">
            {(product.sale_price || cartDiscountPct) ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[14px] font-bold text-neutral-400 line-through leading-none">
                  {product.price.toLocaleString('tr-TR')} ₺
                </span>
                {product.sale_price && (
                  <span className="text-[14px] font-bold text-[#222222] leading-none">
                    {product.sale_price.toLocaleString('tr-TR')} ₺
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[14px] font-bold text-[#222222]">
                {product.price.toLocaleString('tr-TR')} ₺
              </span>
            )}

            {cartDiscountPct && cartPrice && (
              <div className={`text-[14px] font-bold ${cartDiscountTextColor(cartDiscountPct)} leading-none`}>
                Sepette: {cartPrice.toLocaleString('tr-TR')} ₺
              </div>
            )}
          </div>

          {/* Mobil: her zaman görünür ikon butonu */}
          {!sold && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Sepete ekle"
              className="md:hidden flex-shrink-0 w-8 h-8 rounded-xl bg-[#222222]/10 text-[#222222] flex items-center justify-center active:bg-[#222222] active:text-white transition-colors"
            >
              <ShoppingCart size={14} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Son 30 günün en düşük fiyatı rozeti */}
        {(product.sale_price || product.cart_discount_percent) && (
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
            <TrendingDown size={11} className="flex-shrink-0" />
            Son 30 Günün En Düşük Fiyatı
          </div>
        )}

        {/* Renk swatchları — en altta, tıklanabilir */}
        {colors.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setShowVariantPicker(true) }}
            className="flex items-center gap-1 pt-1 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Renk seçeneklerini gör"
          >
            {colors.slice(0, 6).map((c, i) => {
              const { bg, known } = resolveColor(c)
              return (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full border border-neutral-200 shadow-sm flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: bg }}
                  title={c}
                >
                  {!known && (
                    <span className="text-[7px] font-bold leading-none" style={{ color: '#555' }}>
                      {c.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              )
            })}
            {colors.length > 6 && (
              <span className="text-[10px] text-neutral-400 ml-0.5">+{colors.length - 6}</span>
            )}
          </button>
        )}
      </div>
    </Link>

    {/* ── Variant Picker — Bottom Sheet ── */}
    {showVariantPicker && activeVariants.length > 0 && (
      <>
        {/* Şeffaf overlay — sadece kapatmak için, arka plan kararmaz */}
        <div className="fixed inset-0 z-40" onClick={() => setShowVariantPicker(false)} />

        {/* Sheet — aşağıdan yukarı açılır */}
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1360px] mx-auto">
          <div className="bg-white rounded-t-xl shadow-[0_-6px_24px_rgba(0,0,0,0.08)] border-t border-l border-r border-neutral-100">

            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-0">
              <div className="w-8 h-[3px] rounded-full bg-neutral-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-2 pb-2.5 border-b border-neutral-100">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-800 line-clamp-1">{product.name}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Diğer Renk Seçenekleri ({activeVariants.length})</p>
              </div>
              <button
                onClick={() => setShowVariantPicker(false)}
                className="ml-3 flex-shrink-0 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                aria-label="Kapat"
              >
                <X size={13} className="text-neutral-500" />
              </button>
            </div>

            {/* Variant grid */}
            <div className="overflow-x-auto overflow-y-hidden">
              <div className="flex gap-3 px-4 py-3" style={{ width: 'max-content' }}>
                {activeVariants.map((variant, vi) => {
                  const colorEntry = Object.entries(variant.attributes ?? {}).find(([k]) => isColorKey(k))
                  const colorName  = colorEntry?.[1] ?? variant.name
                  const price      = (variant.sale_price ?? variant.price) ?? 0
                  const imgSrc     = images[vi] ?? images[0] ?? null
                  return (
                    <Link
                      key={variant.id}
                      href={`/urunler/${product.slug}`}
                      onClick={() => setShowVariantPicker(false)}
                      className="group flex-shrink-0 w-[110px]"
                    >
                      <div className="w-[110px] h-[110px] rounded-lg overflow-hidden bg-[#F8F8F6] relative border border-neutral-100 group-hover:border-neutral-300 transition-colors">
                        {imgSrc ? (
                          <Image src={imgSrc} alt={colorName} fill className="object-cover" sizes="110px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xl">🛋️</div>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-neutral-600 mt-1.5 truncate">{colorName}</p>
                      <p className="text-[12px] font-bold text-neutral-900">{price.toLocaleString('tr-TR')} ₺</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          </div>
        </div>
      </>
    )}
  </>
  )
}

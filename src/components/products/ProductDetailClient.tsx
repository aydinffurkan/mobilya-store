'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Share2, Check, Truck, ShieldCheck, Wrench, RotateCcw } from 'lucide-react'
import { Product } from '@/types'
import ProductImageGallery from '@/components/products/ProductImageGallery'
import ProductPurchasePanel from '@/components/products/ProductPurchasePanel'
import ProductAccordion from '@/components/products/ProductAccordion'
import ProductFAQ from '@/components/products/ProductFAQ'

const SERVICES = [
  { icon: Truck,       label: 'Ücretsiz Teslimat', sub: '14 gün içinde kapınızda.'          },
  { icon: Wrench,      label: 'Ücretsiz Kurulum',  sub: 'Uzman ekip, zahmetsiz montaj.'      },
  { icon: ShieldCheck, label: '2 Yıl Garanti',     sub: 'Üretici hatalarına karşı koruma.'  },
  { icon: RotateCcw,   label: '30 Gün İade',       sub: 'Koşulsuz iade, tam para iadesi.'   },
]

interface GroupOption {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  sale_price: number | null
  variant_group_label: string | null
}

export default function ProductDetailClient({ product, groupOptions = [] }: { product: Product; groupOptions?: GroupOption[] }) {
  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = window.location.href
    const data = { title: product.name, text: product.name, url }
    if (navigator.share && navigator.canShare?.(data)) {
      try { await navigator.share(data); return } catch {}
    }
    await navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }, [product.name])

  const activeComponents = useMemo(
    () =>
      (product.components ?? [])
        .filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [product.components]
  )

  const [componentQuantities, setComponentQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(activeComponents.map((c) => [c.id, c.default_quantity]))
  )
  const [changeRequest, setChangeRequest] = useState(0)

  const handleComponentChange = (id: string, qty: number) => {
    setComponentQuantities((prev) => ({ ...prev, [id]: qty }))
  }

  const handleChangeComponents = () => {
    setChangeRequest((r) => r + 1)
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 xl:gap-x-20 gap-y-3 lg:gap-y-10 lg:items-start pt-4 lg:pt-8">

      {/* ── 1: Görsel — mobile'de en üstte ── */}
      <div className="lg:col-span-7 lg:row-start-1">
        <ProductImageGallery images={product.images ?? []} name={product.name} />
      </div>

      {/* ── 2: Satın alma — mobile'de görsel hemen altında ── */}
      <div className="lg:col-span-5 lg:row-start-1 lg:sticky lg:top-32 space-y-3 lg:space-y-6">

        {/* Breadcrumb — sadece sm+ */}
        <nav className="hidden sm:flex text-xs tracking-wider text-neutral-400 font-light items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-neutral-600 transition-colors">Ana Sayfa</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/kategori/${product.category.slug}`}
                className="hover:text-neutral-600 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-600 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Mobil kategori etiketi */}
        {product.category && (
          <Link
            href={`/kategori/${product.category.slug}`}
            className="sm:hidden text-[10px] tracking-widest uppercase text-neutral-400 font-medium hover:text-neutral-600 transition-colors"
          >
            {product.category.name}
          </Link>
        )}

        {/* Başlık + Paylaş */}
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-neutral-900 uppercase leading-snug">
            {product.name}
          </h1>
          <button
            type="button"
            onClick={handleShare}
            className="text-neutral-400 hover:text-neutral-900 transition-colors pt-1 flex-shrink-0"
            aria-label="Paylaş"
          >
            {shareCopied
              ? <Check className="w-5 h-5 text-emerald-500 stroke-[1.5]" />
              : <Share2 className="w-5 h-5 stroke-[1.5]" />
            }
          </button>
        </div>

        {/* Bağlı ürün seçenekleri (grup) — tıklayınca o ürünün sayfası açılır */}
        {groupOptions.length > 1 && (
          <div className="border border-neutral-100 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-neutral-100 bg-neutral-50/60">
              <span className="text-[13px] font-semibold text-neutral-700">{product.variant_group_title || 'Seçenekler'}</span>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2.5">
              {groupOptions.map((opt) => {
                const current = opt.id === product.id
                const img = opt.images?.[0] ?? null
                const price = opt.sale_price ?? opt.price
                const label = opt.variant_group_label || opt.name
                const inner = (
                  <>
                    <div className="relative aspect-[4/3] bg-neutral-50">
                      {img ? (
                        <Image src={img} alt={label} fill quality={95} className="object-cover" sizes="(max-width: 1024px) 30vw, 160px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300 text-lg">🛋️</div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[11px] text-neutral-600 truncate">{label}</p>
                      <p className="text-[12px] font-bold text-neutral-900">{price.toLocaleString('tr-TR')} ₺</p>
                    </div>
                  </>
                )
                return current ? (
                  <div key={opt.id} className="rounded-lg border-2 border-neutral-900 overflow-hidden">{inner}</div>
                ) : (
                  <Link key={opt.id} href={`/urunler/${opt.slug}`} className="rounded-lg border border-neutral-200 hover:border-neutral-400 overflow-hidden transition-all block">{inner}</Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Satın Alma Paneli */}
        <ProductPurchasePanel
          product={product}
          componentQuantities={componentQuantities}
          onChangeComponents={handleChangeComponents}
        />

        {/* Hizmetler */}
        <div className="border-t border-neutral-100 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-0 sm:space-y-4 text-xs text-neutral-600 font-light tracking-wide">
            {SERVICES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-neutral-50 sm:bg-transparent rounded-md sm:rounded-none p-3 sm:p-0">
                <Icon className="w-5 h-5 text-neutral-400 stroke-[1.5] flex-shrink-0" />
                <span>
                  <strong className="font-semibold text-neutral-700 block sm:inline">{label}</strong>
                  <span className="sm:hidden"> </span>
                  <span className="text-neutral-400 text-[10px] sm:text-xs sm:text-neutral-600"><span className="hidden sm:inline">: </span>{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 3: Accordion — mobile'de en altta, desktop'ta sol sütun 2. satır ── */}
      <div className="lg:col-span-7 lg:row-start-2">
        <ProductAccordion
          product={product}
          componentQuantities={componentQuantities}
          onComponentChange={handleComponentChange}
          changeRequest={changeRequest}
        />
      </div>

    </div>

    {/* ── SSS ── */}
    <ProductFAQ items={product.faq_items} />
    </>
  )
}
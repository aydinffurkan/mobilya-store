'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
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

export default function ProductDetailClient({ product }: { product: Product }) {
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
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, X } from 'lucide-react'
import { useCartPreviewStore, type CartPreviewItem } from '@/store/cartPreviewStore'

const AUTO_CLOSE_MS = 4500

export default function CartPreviewPopup() {
  const { item, hide } = useCartPreviewStore()
  const [visible, setVisible] = useState(false)
  const [display, setDisplay] = useState<CartPreviewItem | null>(null)

  useEffect(() => {
    if (item) {
      setDisplay(item)
      setVisible(true)
    } else {
      setVisible(false)
      const t = setTimeout(() => setDisplay(null), 350)
      return () => clearTimeout(t)
    }
  }, [item])

  useEffect(() => {
    if (!item) return
    const t = setTimeout(hide, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [item, hide])

  if (!display) return null

  const totalPrice = display.unitPrice * display.quantity
  const image = display.product.images?.[0] ?? null

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] w-80 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden">

        {/* Başarı bandı */}
        <div className="bg-emerald-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-white flex-shrink-0" />
            <span className="text-white text-sm font-medium">Sepetinize eklendi!</span>
          </div>
          <button
            onClick={hide}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        {/* Ürün önizleme */}
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
            {image ? (
              <Image
                src={image}
                alt={display.product.name}
                width={68}
                height={68}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-200" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2">
              {display.product.name}
              {display.variant && (
                <span className="font-normal text-neutral-500"> — {display.variant.name}</span>
              )}
            </p>
            {display.quantity > 1 && (
              <p className="text-xs text-neutral-400 mt-0.5">{display.quantity} adet</p>
            )}
            <p className="text-sm font-bold text-neutral-900 mt-1">
              {totalPrice.toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>

        {/* Eylem butonları */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <Link
            href="/sepet"
            onClick={hide}
            className="py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 text-center hover:bg-neutral-50 transition-colors"
          >
            Sepeti görüntüle
          </Link>
          <Link
            href="/odeme"
            onClick={hide}
            className="py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold text-center hover:bg-neutral-700 transition-colors"
          >
            Ödeme yap
          </Link>
        </div>

        {/* Otomatik kapanma çubuğu */}
        <div className="h-0.5 bg-neutral-100 mx-4 mb-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full origin-left"
            style={{
              animation: visible ? `shrink ${AUTO_CLOSE_MS}ms linear forwards` : 'none',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}
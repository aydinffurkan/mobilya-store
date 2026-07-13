'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { SlideHotspot } from '@/types'

interface HotspotPopupProps {
  hotspot: SlideHotspot
  onClose: () => void
}

export default function HotspotPopup({ hotspot, onClose }: HotspotPopupProps) {
  const toLeft = hotspot.x > 55
  const toTop = hotspot.y > 55

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 30,
    width: 224,
    ...(toLeft
      ? { right: `calc(${100 - hotspot.x}% + 20px)` }
      : { left: `calc(${hotspot.x}% + 20px)` }),
    ...(toTop
      ? { bottom: `calc(${100 - hotspot.y}% + 20px)` }
      : { top: `calc(${hotspot.y}% - 8px)` }),
  }

  return (
    <div
      style={style}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
        aria-label="Kapat"
      >
        <X size={12} className="text-white" />
      </button>

      <div className="relative w-full h-32 bg-gray-100 overflow-hidden">
        {hotspot.product_image_url ? (
          <Image
            src={hotspot.product_image_url}
            alt={hotspot.product_name}
            fill
            className="object-cover"
            sizes="224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Görsel yok
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
          {hotspot.product_name}
        </p>
        <p className="mt-1.5">
          {hotspot.product_sale_price ? (
            <span className="flex items-center gap-1.5">
              <span className="text-[#222222] font-bold text-sm">
                {hotspot.product_sale_price.toLocaleString('tr-TR')}₺
              </span>
              <span className="text-xs text-gray-400 line-through">
                {hotspot.product_price.toLocaleString('tr-TR')}₺
              </span>
            </span>
          ) : (
            <span className="text-[#222222] font-bold text-sm">
              {hotspot.product_price.toLocaleString('tr-TR')}₺
            </span>
          )}
        </p>
        <Link
          href={`/urunler/${hotspot.product_slug}`}
          className="mt-2.5 block w-full py-2 bg-black hover:bg-black/80 text-white text-xs font-medium text-center rounded-lg transition-colors"
        >
          + Ürünü İncele
        </Link>
      </div>
    </div>
  )
}

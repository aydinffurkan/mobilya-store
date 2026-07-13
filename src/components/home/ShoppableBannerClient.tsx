'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, X } from 'lucide-react'
import { ShoppableBannerData } from '@/lib/repositories/settings'
import HotspotPopup from '@/components/shared/HotspotPopup'

interface Props {
  banner: ShoppableBannerData
}

export default function ShoppableBannerClient({ banner }: Props) {
  const [openHotspot, setOpenHotspot] = useState<number | null>(null)

  return (
    <section className="w-full bg-white py-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {(banner.title || banner.subtitle) && (
          <div className="text-center mb-8">
            {banner.title && (
              <h2 className="text-xl md:text-2xl font-medium text-[#222] tracking-wide mb-2">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="text-[13px] md:text-sm text-[#999] font-light">{banner.subtitle}</p>
            )}
          </div>
        )}

        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: '16/7' }}
          onClick={() => openHotspot !== null && setOpenHotspot(null)}
        >
          <Image
            src={banner.image_url!}
            alt={banner.title || 'Tıklanabilir görsel'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1360px) 100vw, 1360px"
            priority
          />

          {banner.hotspots.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpenHotspot(openHotspot === i ? null : i) }}
              className="absolute z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-transform"
              style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
              aria-label={h.product_name}
            >
              {openHotspot === i
                ? <X size={16} className="text-black" />
                : <Plus size={16} className="text-black" />}
            </button>
          ))}

          {openHotspot !== null && banner.hotspots[openHotspot] && (
            <HotspotPopup
              hotspot={banner.hotspots[openHotspot]}
              onClose={() => setOpenHotspot(null)}
            />
          )}
        </div>
      </div>
    </section>
  )
}

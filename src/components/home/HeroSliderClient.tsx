'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { HeroSlide } from '@/types'
import HotspotPopup from '@/components/shared/HotspotPopup'

interface Props {
  slides: HeroSlide[]
}

const AUTO_ADVANCE_MS = 6000

export default function HeroSliderClient({ slides }: Props) {
  const [index, setIndex] = useState(0)
  const [openHotspot, setOpenHotspot] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const count = slides.length

  const goTo = useCallback((next: number) => {
    setIndex(((next % count) + count) % count)
  }, [count])

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (count <= 1 || openHotspot !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [count, index, openHotspot])

  useEffect(() => { setOpenHotspot(null) }, [index])

  const handleManualNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current)
    fn()
  }

  const hotspots = slides[index]?.hotspots ?? []

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-amber-950 to-amber-800 text-white">
      <div className="relative h-[280px] md:h-[360px] lg:h-auto lg:aspect-[16/5]">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const imgEl = slide.image_url ? (
              <Image
                src={slide.image_url}
                alt={slide.title}
                fill
                className="object-cover pointer-events-none select-none"
                sizes="100vw"
                priority={i === 0}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-lg">
                Görsel yok
              </div>
            )

            return (
              <div
                key={i}
                className="relative h-full w-full flex-shrink-0"
                onClick={() => openHotspot !== null && setOpenHotspot(null)}
              >
                {slide.cta_href && !slide.hotspots?.length ? (
                  <Link href={slide.cta_href} className="absolute inset-0 block">
                    {imgEl}
                  </Link>
                ) : (
                  <div className="absolute inset-0">{imgEl}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Hotspot butonları */}
        {hotspots.map((h, hi) => (
          <button
            key={hi}
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenHotspot(openHotspot === hi ? null : hi) }}
            className="absolute z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-transform"
            style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
            aria-label={h.product_name}
          >
            {openHotspot === hi
              ? <X size={16} className="text-black" />
              : <Plus size={16} className="text-black" />}
          </button>
        ))}

        {openHotspot !== null && hotspots[openHotspot] && (
          <HotspotPopup
            hotspot={hotspots[openHotspot]}
            onClose={() => setOpenHotspot(null)}
          />
        )}

        {/* Navigasyon */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => handleManualNav(prev)}
              aria-label="Önceki slayt"
              className="absolute z-10 left-3 md:left-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/80 hover:bg-white text-black/60 hover:text-black shadow-sm transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleManualNav(next)}
              aria-label="Sonraki slayt"
              className="absolute z-10 right-3 md:right-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/80 hover:bg-white text-black/60 hover:text-black shadow-sm transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleManualNav(() => goTo(i))}
                  aria-label={`${i + 1}. slayta git`}
                  className={`h-2.5 w-2.5 rounded-full border transition-all ${
                    i === index ? 'bg-white border-white' : 'bg-transparent border-white/70 hover:border-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroSlide } from '@/types'

interface Props {
  slides: HeroSlide[]
}

const AUTO_ADVANCE_MS = 6000

export default function HeroSliderClient({ slides }: Props) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const count = slides.length

  const goTo = useCallback((next: number) => {
    setIndex(((next % count) + count) % count)
  }, [count])

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (count <= 1) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [count, index])

  const handleManualNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current)
    fn()
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-amber-950 to-amber-800 text-white">
      <div className="relative h-[420px] md:h-[560px]">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const image = slide.image_url ? (
              <img
                src={slide.image_url}
                alt={slide.title}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-lg">
                Görsel yok
              </div>
            )

            return (
              <div key={i} className="relative h-full w-full flex-shrink-0">
                {slide.cta_href ? (
                  <Link href={slide.cta_href} className="absolute inset-0 block">
                    {image}
                  </Link>
                ) : (
                  image
                )}
              </div>
            )
          })}
        </div>

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
                    i === index
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/70 hover:border-white'
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

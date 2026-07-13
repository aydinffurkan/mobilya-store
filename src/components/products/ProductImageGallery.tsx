'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  images: string[]
  name: string
}

const THUMB_VISIBLE = 4

export default function ProductImageGallery({ images, name }: Props) {
  const [selected, setSelected]     = useState(0)
  const [thumbStart, setThumbStart] = useState(0)
  const [modalOpen, setModalOpen]   = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const canThumbPrev = thumbStart > 0
  const canThumbNext = thumbStart + THUMB_VISIBLE < images.length

  const prevMain = () => {
    const next = (selected - 1 + images.length) % images.length
    setSelected(next)
    if (next < thumbStart) setThumbStart(next)
    if (next >= thumbStart + THUMB_VISIBLE) setThumbStart(Math.max(0, next - THUMB_VISIBLE + 1))
  }

  const nextMain = () => {
    const next = (selected + 1) % images.length
    setSelected(next)
    if (next >= thumbStart + THUMB_VISIBLE) setThumbStart(thumbStart + 1)
    if (next < thumbStart) setThumbStart(0)
  }

  const selectImage = (i: number) => {
    setSelected(i)
    if (i < thumbStart) setThumbStart(i)
    if (i >= thumbStart + THUMB_VISIBLE) setThumbStart(i - THUMB_VISIBLE + 1)
  }

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [modalOpen])

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full flex items-center justify-center">
        <div className="text-center text-neutral-300">
          <div className="text-6xl mb-3">🛋️</div>
          <p className="text-sm font-light">Görsel yakında eklenecek</p>
        </div>
      </div>
    )
  }

  const visibleThumbs = images.slice(thumbStart, thumbStart + THUMB_VISIBLE)

  return (
    <div className="w-full select-none">

      {/* ── Ana büyük görsel ── */}
      <div
        ref={mainRef}
        className="relative w-full aspect-[4/3] overflow-hidden cursor-zoom-in group"
        onClick={() => setModalOpen(true)}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const diff = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) diff > 0 ? nextMain() : prevMain()
          touchStartX.current = null
        }}
      >
        <Image
          src={images[selected]}
          alt={`${name} — görsel ${selected + 1}`}
          fill
          priority
          className="object-contain object-top transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 55vw"
        />

        {/* Sol/sağ ok — sadece birden fazla görsel varsa */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevMain() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              aria-label="Önceki görsel"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextMain() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              aria-label="Sonraki görsel"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>

            {/* Mobil dot göstergesi */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none sm:hidden">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-200 ${
                    i === selected ? 'w-4 h-1.5 bg-neutral-800' : 'w-1.5 h-1.5 bg-neutral-400/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Görsel sayacı */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/35 text-white text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wide hidden sm:block">
            {selected + 1} / {images.length}
          </div>
        )}
      </div>

      {/* ── Thumbnail şeridi ── */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 mt-3">

          {/* Sol ok */}
          <button
            type="button"
            onClick={() => setThumbStart((s) => Math.max(0, s - 1))}
            disabled={!canThumbPrev}
            className="flex-shrink-0 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={15} strokeWidth={1.5} />
          </button>

          {/* Thumbnail listesi */}
          <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${THUMB_VISIBLE}, 1fr)` }}>
            {visibleThumbs.map((url, idx) => {
              const realIndex = thumbStart + idx
              return (
                <button
                  key={`${url}-${realIndex}`}
                  type="button"
                  onClick={() => selectImage(realIndex)}
                  className={`relative aspect-[4/3] w-full overflow-hidden transition-all duration-200 ${
                    realIndex === selected
                      ? 'opacity-100 outline outline-2 outline-neutral-900 outline-offset-1'
                      : 'opacity-45 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${name} ${realIndex + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="(max-width: 768px) 22vw, 12vw"
                  />
                </button>
              )
            })}
          </div>

          {/* Sağ ok */}
          <button
            type="button"
            onClick={() => setThumbStart((s) => Math.min(images.length - THUMB_VISIBLE, s + 1))}
            disabled={!canThumbNext}
            className="flex-shrink-0 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>

        </div>
      )}

      {/* ── Lightbox ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 md:p-10"
          onClick={() => setModalOpen(false)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2 bg-neutral-900/50 rounded-full transition-colors"
            onClick={() => setModalOpen(false)}
            aria-label="Kapat"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>

          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const diff = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 40) diff > 0 ? nextMain() : prevMain()
              touchStartX.current = null
            }}
          >
            <Image
              src={images[selected]}
              alt={`${name} — büyük görsel`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevMain() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={22} strokeWidth={1.5} className="text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMain() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight size={22} strokeWidth={1.5} className="text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

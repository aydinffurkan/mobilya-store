'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface Props {
  leftImage: string
  rightImage: string
  leftLabel?: string
  rightLabel?: string
}

export default function BeforeAfterSlider({ leftImage, rightImage, leftLabel, rightLabel }: Props) {
  const [pos, setPos] = useState(50)          // 0–100 yüzde
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const clamp = (v: number) => Math.min(100, Math.max(0, v))

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    setPos(clamp(((clientX - left) / width) * 100))
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }
  const onTouchStart = () => { dragging.current = true }

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) updatePos(e.clientX) }
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current && e.touches[0]) updatePos(e.touches[0].clientX)
    }
    const stop = () => { dragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', stop)
    }
  }, [updatePos])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-col-resize rounded-2xl"
      style={{ aspectRatio: '16/7' }}
      onMouseDown={(e) => { if (e.target === containerRef.current) { dragging.current = true } }}
    >
      {/* Sağ görsel — arka plan */}
      <Image
        src={rightImage}
        alt={rightLabel ?? 'Sonra'}
        fill
        priority
        className="object-cover pointer-events-none"
        sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(100vw - 48px), 1328px"
        draggable={false}
      />

      {/* Sol görsel — clip-path ile kırpılmış, boyutu değişmez */}
      <Image
        src={leftImage}
        alt={leftLabel ?? 'Önce'}
        fill
        priority
        className="object-cover pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(100vw - 48px), 1328px"
        draggable={false}
      />

      {/* Sol etiket */}
      {leftLabel && (
        <div className="absolute top-4 left-4 bg-black/60 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none">
          {leftLabel}
        </div>
      )}

      {/* Sağ etiket */}
      {rightLabel && (
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none">
          {rightLabel}
        </div>
      )}

      {/* Çizgi + tutamaç */}
      <div
        className="absolute inset-y-0 z-10 flex flex-col items-center justify-center"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Dikey çizgi */}
        <div className="w-0.5 flex-1 bg-white/90 shadow" />

        {/* Tutamaç */}
        <div className="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing flex-shrink-0 border border-white/30">
          <ChevronLeft size={14} className="text-[#222] -mr-0.5" />
          <ChevronRight size={14} className="text-[#222] -ml-0.5" />
        </div>

        {/* Dikey çizgi (alt) */}
        <div className="w-0.5 flex-1 bg-white/90 shadow" />
      </div>
    </div>
  )
}

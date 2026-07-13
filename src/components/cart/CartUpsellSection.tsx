'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'

interface Props {
  products: Product[]
}

export default function CartUpsellSection({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDown    = useRef(false)
  const startX    = useRef(0)
  const startLeft = useRef(0)
  const dragged   = useRef(false)

  const scroll = (dir: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollRef.current) return
    isDown.current   = true
    dragged.current  = false
    startX.current   = e.clientX
    startLeft.current = scrollRef.current.scrollLeft
    scrollRef.current.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDown.current || !scrollRef.current) return
    e.preventDefault()
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > 4) dragged.current = true
    scrollRef.current.scrollLeft = startLeft.current - delta
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDown.current) return
    isDown.current = false
    scrollRef.current?.releasePointerCapture(e.pointerId)
  }

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) { e.preventDefault(); e.stopPropagation() }
  }

  if (!products.length) return null

  return (
    <section className="bg-[#F8F8F6] border-t border-border py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium mb-1">
            Önerilen Ürünler
          </p>
          <h2 className="text-xl font-bold text-neutral-900">
            Kasa Arkası Ürünler
          </h2>
        </div>

        {/* Scroll container */}
        <div className="relative group/upsell">
          <div
            ref={scrollRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
            onDragStart={(e) => e.preventDefault()}
            className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2 select-none cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[200px] sm:w-[230px] lg:w-[260px]">
                <ProductCard product={product} />
              </div>
            ))}
            <div className="flex-shrink-0 w-2" />
          </div>

          {/* Önceki */}
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Önceki"
            className="hidden md:flex absolute left-0 top-[38%] -translate-y-1/2 -translate-x-4 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-neutral-500 hover:text-[#222222] hover:border-[#222222]/30 opacity-0 group-hover/upsell:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Sonraki */}
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Sonraki"
            className="hidden md:flex absolute right-0 top-[38%] -translate-y-1/2 translate-x-4 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-neutral-500 hover:text-[#222222] hover:border-[#222222]/30 opacity-0 group-hover/upsell:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={16} />
          </button>
        </div>


      </div>
    </section>
  )
}

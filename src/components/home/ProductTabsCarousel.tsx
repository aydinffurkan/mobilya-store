'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CategoryProductTab } from '@/lib/repositories/products'
import ProductCard from '@/components/products/ProductCard'

interface Props {
  tabs: CategoryProductTab[]
}

export default function ProductTabsCarousel({ tabs }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDown = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const hasDragged = useRef(false)

  const activeTab = tabs[activeIndex]

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollRef.current) return
    isDown.current = true
    hasDragged.current = false
    startX.current = e.clientX
    startScrollLeft.current = scrollRef.current.scrollLeft
    setIsDragging(true)
    scrollRef.current.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDown.current || !scrollRef.current) return
    e.preventDefault()
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > 4) hasDragged.current = true
    scrollRef.current.scrollLeft = startScrollLeft.current - delta
  }

  const endDrag = (e: React.PointerEvent) => {
    if (!isDown.current) return
    isDown.current = false
    setIsDragging(false)
    if (scrollRef.current?.hasPointerCapture(e.pointerId)) {
      scrollRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div>
      {/* Sekmeler */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-1 flex-wrap mb-8 border-b border-neutral-100">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveIndex(i)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                i === activeIndex ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.name}
              {i === activeIndex && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-[#222222]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className={`flex gap-4 overflow-x-auto pb-2 pl-4 sm:pl-6 lg:pl-8 [&::-webkit-scrollbar]:hidden select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab scroll-smooth'
          }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {activeTab.products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[240px] sm:w-[280px]">
              <ProductCard product={product} />
            </div>
          ))}
          <div className="flex-shrink-0 w-2" />
        </div>

        {activeTab.products.length > 4 && (
          <>
            <button
              onClick={() => scroll(-1)}
              className="hidden md:flex absolute left-2 top-[38%] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-neutral-600 hover:text-[#222222] hover:border-[#222222]/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="hidden md:flex absolute right-2 top-[38%] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-neutral-600 hover:text-[#222222] hover:border-[#222222]/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

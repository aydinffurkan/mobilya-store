'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  published_at: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogCarousel({ posts }: { posts: Post[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  const update = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    window.addEventListener('resize', update)
    el.addEventListener('scroll', update, { passive: true })
    return () => {
      window.removeEventListener('resize', update)
      el.removeEventListener('scroll', update)
    }
  }, [posts])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector('a') as HTMLElement | null
    const step = (card?.offsetWidth ?? 300) + 20
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Başlık */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#222]">Blog Köşesi</h2>
        <p className="text-sm text-neutral-500 mt-1.5">Mobilya dünyasının inceliklerine dokunun</p>
      </div>

      {/* Oklar */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => scroll('left')}
          disabled={!canLeft}
          className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-[#222] hover:text-white hover:border-[#222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => scroll('right')}
          disabled={!canRight}
          className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-[#222] hover:text-white hover:border-[#222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Kayan kartlar */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex-shrink-0 w-[78vw] sm:w-[42vw] lg:w-[calc(25%-15px)]"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Görsel */}
            <div className="relative w-full rounded-xl overflow-hidden bg-neutral-100" style={{ aspectRatio: '4/3' }}>
              {post.cover_image_url ? (
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 320px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#e8e0d4] to-[#c8b99e]" />
              )}
              {post.category && (
                <span className="absolute top-3 left-3 bg-white/90 text-[#222] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
              )}
            </div>

            {/* İçerik */}
            <div className="mt-4 space-y-2">
              <h3 className="text-[#222] font-semibold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-neutral-500 transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-neutral-500 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              {post.published_at && (
                <p className="text-[11px] text-neutral-400 pt-1">
                  {formatDate(post.published_at)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Tüm bloglar */}
      <div className="text-center mt-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 bg-[#222] text-white text-sm font-medium px-8 py-3 rounded-full hover:opacity-85 transition-opacity"
        >
          Tüm Bloglar
        </Link>
      </div>
    </div>
  )
}

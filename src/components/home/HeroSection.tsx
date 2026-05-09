'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const slides = [
  {
    title: 'Ulaşılabilir Lüks',
    subtitle: 'Yatak Odası Koleksiyonları',
    desc: 'Modern ve klasik çizgilerin buluştuğu özel tasarım mobilyalar. Ücretsiz nakliye ve kurulum.',
    href: '/kategori/yatak-odasi',
    bg: 'from-amber-950 to-amber-800',
    cta: 'Koleksiyonu Gör',
  },
  {
    title: 'Yeni Sezon',
    subtitle: 'Yemek Odası Takımları',
    desc: 'Sofranıza zarafet katacak yemek odası takımları. 2 yıl garanti güvencesiyle.',
    href: '/kategori/yemek-odasi',
    bg: 'from-stone-800 to-stone-600',
    cta: 'Keşfet',
  },
]

export default function HeroSection() {
  return (
    <section className="relative">
      <div className={`bg-gradient-to-r ${slides[0].bg} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest">
              {slides[0].subtitle}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {slides[0].title}
            </h1>
            <p className="text-gray-300 text-lg max-w-md leading-relaxed">
              {slides[0].desc}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href={slides[0].href} className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#c9a84c] hover:bg-[#b8962f] text-white font-semibold text-sm transition-colors">
                {slides[0].cta} <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link href="/urunler" className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-white text-white hover:bg-white/10 font-semibold text-sm transition-colors">
                Tüm Ürünler
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex gap-6 pt-4 text-sm text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5">✓ Ücretsiz Nakliye</span>
              <span className="flex items-center gap-1.5">✓ Ücretsiz Kurulum</span>
              <span className="flex items-center gap-1.5">✓ 2 Yıl Garanti</span>
            </div>
          </div>

          {/* Decorative placeholder — replace with real hero image */}
          <div className="hidden md:flex justify-center">
            <div className="w-80 h-64 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-white/40 text-lg border border-white/20">
              Hero Görseli
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CollectionCTA() {
  return (
    <section className="w-full bg-[#222222] py-14 sm:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-8">

        {/* Metin */}
        <div className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a84c] font-semibold mb-3">
            Yeni Sezon
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white leading-tight">
            Koleksiyonumuzu
            <br />
            <span className="font-bold">Keşfettiniz mi?</span>
          </h2>
          <p className="text-white/50 text-sm sm:text-base mt-3 max-w-[420px]">
            Binlerce mobilya seçeneği, özel tasarımlar ve size özel fırsatlar sizi bekliyor.
          </p>
        </div>

        {/* CTA butonları */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
          <Link
            href="/urunler"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#c9a84c] text-[#222222] text-sm font-bold rounded-full hover:bg-[#b8943d] transition-colors whitespace-nowrap"
          >
            Tüm Ürünleri Gör <ArrowRight size={15} />
          </Link>
          <Link
            href="/urunler?sort=newest"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Yeni Gelenler
          </Link>
        </div>

      </div>
    </section>
  )
}

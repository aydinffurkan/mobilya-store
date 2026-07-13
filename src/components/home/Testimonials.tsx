import { getTestimonials, getSectionVisible } from '@/lib/repositories/settings'
import { Star } from 'lucide-react'

export default async function Testimonials() {
  const [items, visible] = await Promise.all([getTestimonials(), getSectionVisible('testimonials')])
  if (!visible || items.length === 0) return null

  return (
    <section className="w-full bg-[#faf9f7] py-14">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-medium text-[#222] tracking-wide mb-2">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="text-[13px] md:text-sm text-[#999] font-light">
            Binlerce memnun müşterimizin deneyimleri
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0ebe4] flex flex-col gap-3"
            >
              {/* Yıldızlar */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={15}
                    className={s < item.rating ? 'fill-[#c9a227] text-[#c9a227]' : 'fill-none text-[#ddd]'}
                  />
                ))}
              </div>

              {/* Yorum */}
              <p className="text-[14px] text-[#555] leading-relaxed flex-1">
                &ldquo;{item.text}&rdquo;
              </p>

              {/* Müşteri */}
              <div className="pt-2 border-t border-[#f0ebe4]">
                <p className="text-sm font-semibold text-[#222]">{item.name}</p>
                <p className="text-xs text-[#aaa]">{item.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
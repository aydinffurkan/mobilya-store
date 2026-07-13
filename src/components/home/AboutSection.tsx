import Image from 'next/image'
import Link from 'next/link'
import { getAboutSection, getSectionVisible } from '@/lib/repositories/settings'

export default async function AboutSection() {
  const [data, visible] = await Promise.all([getAboutSection(), getSectionVisible('about_section')])
  if (!visible || !data) return null

  return (
    <section className="w-full bg-white py-14">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Metin */}
          <div className="order-2 md:order-1 flex flex-col gap-5">
            <h2 className="text-2xl md:text-3xl font-medium text-[#222222] leading-snug">
              {data.title}
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#666] leading-relaxed whitespace-pre-line">
              {data.text}
            </p>
            <Link
              href="/hakkimizda"
              className="self-start inline-flex items-center gap-2 text-sm font-medium text-[#222222] border border-[#222222] rounded-full px-5 py-2 hover:bg-[#222222] hover:text-white transition-colors"
            >
              Daha Fazla Bilgi
            </Link>
          </div>

          {/* Görsel */}
          {data.image_url && (
            <div className="order-1 md:order-2 relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image
                src={data.image_url}
                alt={data.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
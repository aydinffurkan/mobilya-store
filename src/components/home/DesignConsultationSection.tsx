import Image from 'next/image'
import Link from 'next/link'
import { Phone } from 'lucide-react'
import { getDesignConsultation, getSectionVisible } from '@/lib/repositories/settings'

export default async function DesignConsultationSection() {
  const [data, visible] = await Promise.all([getDesignConsultation(), getSectionVisible('design_consultation')])
  if (!visible || !data) return null

  return (
    <section className="w-full bg-[#FAF8F4] py-14">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Görsel */}
          {data.image_url && (
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image
                src={data.image_url}
                alt={data.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Metin */}
          <div className={`flex flex-col gap-5 ${!data.image_url ? 'md:col-span-2 items-center text-center' : ''}`}>
            <h2 className="text-2xl md:text-3xl font-medium text-[#222222] leading-snug">
              {data.title}
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#666] leading-relaxed whitespace-pre-line">
              {data.text}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href={data.cta_href}
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#222222] hover:bg-[#222222] hover:opacity-90 rounded-full px-5 py-2.5 transition-colors"
              >
                {data.cta_text}
              </Link>
              {data.phone && (
                <a
                  href={`tel:${data.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#222222] hover:underline"
                >
                  <Phone size={15} /> {data.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

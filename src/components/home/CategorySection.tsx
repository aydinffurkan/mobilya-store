import Link from 'next/link'
import Image from 'next/image'
import { getCategoryShowcaseItems, getSectionVisible } from '@/lib/repositories/settings'

export default async function CategorySection() {
  const [items, visible] = await Promise.all([getCategoryShowcaseItems(), getSectionVisible('category_showcase')])

  if (!visible || items.length === 0) return null

  return (
    <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-16 text-center">

      {/* Başlık */}
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#222222] mb-3">
        Keşfedin
      </p>
      <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
        Mobilya Koleksiyonları
      </h2>
      <p className="mt-3 text-sm text-neutral-400 font-light max-w-md mx-auto">
        İhtiyacınıza göre kategori seçin, stilinize uygun mobilyaları keşfedin
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-12">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href || '/urunler'}
            className="group border border-neutral-100 bg-white rounded-2xl py-6 px-4 flex flex-col items-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            {/* Görsel */}
            <div className="relative w-full h-48 md:h-56">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-[1.06]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-neutral-100 flex items-center justify-center">
                  <span className="text-neutral-300 text-xs">Görsel yok</span>
                </div>
              )}
            </div>

            {/* İsim */}
            <span className="text-sm font-medium tracking-wide text-neutral-800 pt-5 block text-center group-hover:text-[#222222] transition-colors duration-200">
              {item.title}
            </span>
          </Link>
        ))}
      </div>

    </section>
  )
}
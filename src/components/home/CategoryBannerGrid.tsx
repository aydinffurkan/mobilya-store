import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getCategoryBanners, getSectionVisible } from '@/lib/repositories/settings'
import { CategoryBanner } from '@/types'

const FALLBACK_GRADIENTS = [
  'from-stone-600 via-stone-400 to-stone-300',
  'from-amber-800 via-amber-500 to-amber-300',
  'from-neutral-700 via-neutral-500 to-stone-300',
  'from-stone-800 via-stone-500 to-amber-300',
  'from-amber-700 via-stone-500 to-stone-400',
]

const FALLBACK_BANNERS: CategoryBanner[] = [
  { title: 'Dolaplar',    subtitle: 'Şık & Fonksiyonel',       href: '/kategori/dolaplar',    image_url: null, cta: 'Hemen Keşfet'    },
  { title: 'Masa Takımı', subtitle: 'Yemek Odası Koleksiyonu', href: '/kategori/yemek-odasi', image_url: null, cta: 'Koleksiyonu Gör' },
  { title: 'Sehpalar',    subtitle: 'Oturma Odası Aksesuarı',  href: '/kategori/sehpalar',    image_url: null, cta: 'Keşfedin'        },
  { title: 'Kitaplıklar', subtitle: 'Modern & Klasik Tasarım', href: '/kategori/kitapliklar', image_url: null, cta: 'Hemen Keşfet'    },
  { title: 'Koltuklar',   subtitle: 'Konfor & Stil',           href: '/kategori/koltuklar',   image_url: null, cta: 'Keşfedin'        },
]

interface BannerCardProps extends CategoryBanner {
  gradient: string
  imgSizes: string
  className?: string
}

function BannerCard({ title, subtitle, href, image_url, cta, gradient, imgSizes, className = '' }: BannerCardProps) {
  return (
    <Link href={href || '/urunler'} className={`group relative overflow-hidden rounded-2xl ${className}`}>
      <div className="absolute inset-0 overflow-hidden">
        {image_url ? (
          <Image
            src={image_url}
            alt={title}
            fill
            sizes={imgSizes}
            quality={92}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} transition-transform duration-700 ease-out group-hover:scale-[1.06]`} />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 p-5 md:p-6">
        <p className="text-white/55 text-[10px] font-semibold uppercase tracking-widest mb-1">{subtitle}</p>
        <h3 className="text-white font-bold text-xl md:text-2xl leading-snug drop-shadow-sm">{title}</h3>
        <div className="mt-3 md:mt-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/95 text-neutral-800 text-[11px] font-bold rounded-full shadow-sm transition-all duration-300 group-hover:bg-[#222222] group-hover:text-white group-hover:pl-5 group-hover:pr-4">
            {cta || 'Hemen Keşfet'}
            <ArrowRight size={11} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function CategoryBannerGrid() {
  const [dbItems, visible] = await Promise.all([getCategoryBanners(), getSectionVisible('category_banners')])
  if (!visible) return null
  const base    = dbItems.length >= 5 ? dbItems : [...dbItems, ...FALLBACK_BANNERS.slice(dbItems.length)]
  const [b0, b1, b2, b3, b4] = base

  return (
    <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-12">

      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#222222] mb-2">Koleksiyonlar</p>
          <h2 className="text-2xl md:text-[2rem] font-bold text-neutral-900 leading-tight">Evinize Özel Bir Dünya</h2>
        </div>
        <Link href="/urunler" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-[#222222] transition-colors">
          Tüm Ürünler <ArrowRight size={14} />
        </Link>
      </div>

      {/*
        ┌────────┬──────────────────┬────────┐
        │        │   b1 (col 2-3)   │        │
        │   b0   ├─────────┬────────┤   b3   │
        │        │b2(col2) │b4(col3)│        │
        └────────┴─────────┴────────┴────────┘
      */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 md:grid-rows-2 md:h-[680px]">

        {/* Sol — tam boy */}
        <BannerCard
          {...b0}
          gradient={FALLBACK_GRADIENTS[0]}
          imgSizes="(max-width: 768px) 100vw, 25vw"
          className="h-[360px] md:h-auto md:col-start-1 md:col-span-1 md:row-start-1 md:row-span-2"
        />

        {/* Orta üst — geniş */}
        <BannerCard
          {...b1}
          gradient={FALLBACK_GRADIENTS[1]}
          imgSizes="(max-width: 768px) 100vw, 50vw"
          className="h-[300px] md:h-auto md:col-start-2 md:col-span-2 md:row-start-1 md:row-span-1"
        />

        {/* Orta alt sol */}
        <BannerCard
          {...b2}
          gradient={FALLBACK_GRADIENTS[2]}
          imgSizes="(max-width: 768px) 100vw, 25vw"
          className="h-[260px] md:h-auto md:col-start-2 md:col-span-1 md:row-start-2 md:row-span-1"
        />

        {/* Orta alt sağ */}
        <BannerCard
          {...b4}
          gradient={FALLBACK_GRADIENTS[4]}
          imgSizes="(max-width: 768px) 100vw, 25vw"
          className="h-[260px] md:h-auto md:col-start-3 md:col-span-1 md:row-start-2 md:row-span-1"
        />

        {/* Sağ — tam boy */}
        <BannerCard
          {...b3}
          gradient={FALLBACK_GRADIENTS[3]}
          imgSizes="(max-width: 768px) 100vw, 25vw"
          className="h-[360px] md:h-auto md:col-start-4 md:col-span-1 md:row-start-1 md:row-span-2"
        />

      </div>

      <div className="flex md:hidden justify-center mt-6">
        <Link href="/urunler" className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-full text-sm font-medium text-neutral-700 hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222] transition-colors">
          Tüm Ürünleri Gör <ArrowRight size={14} />
        </Link>
      </div>

    </section>
  )
}
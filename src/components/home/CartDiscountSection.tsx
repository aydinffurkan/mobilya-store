import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { cartDiscountGradient } from '@/lib/utils/cartDiscount'

interface DiscountTier {
  pct: number
  image: string | null
}

async function getDiscountTiers(): Promise<DiscountTier[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('cart_discount_percent, images')
      .eq('is_active', true)
      .not('cart_discount_percent', 'is', null)
      .gt('cart_discount_percent', 0)
      .order('cart_discount_percent', { ascending: true })

    if (!data?.length) return []

    const map = new Map<number, string | null>()
    for (const row of data) {
      const pct = row.cart_discount_percent as number
      if (!map.has(pct)) {
        map.set(pct, (row.images as string[] | null)?.[0] ?? null)
      }
    }

    return Array.from(map.entries()).map(([pct, image]) => ({ pct, image }))
  } catch {
    return []
  }
}

export default async function CartDiscountSection() {
  const tiers = await getDiscountTiers()
  if (tiers.length === 0) return null

  return (
    <section className="py-14 bg-white">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <h2 className="text-center text-[13px] font-semibold tracking-[0.2em] uppercase text-neutral-400 mb-2">
          Fırsatları Kaçırma
        </h2>
        <p className="text-center text-2xl sm:text-3xl font-bold text-neutral-900 mb-10">
          Sepette İndirimler
        </p>

        {/* Kartlar */}
        <div className={`grid gap-3 sm:gap-4 ${
          tiers.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
          tiers.length === 2 ? 'grid-cols-2 max-w-xl mx-auto' :
          tiers.length === 3 ? 'grid-cols-2 sm:grid-cols-3' :
          'grid-cols-2 sm:grid-cols-4'
        }`}>
          {tiers.map(({ pct, image }) => (
            <Link
              key={pct}
              href={`/urunler?sepette_indirim=${pct}`}
              className="group relative overflow-hidden rounded-2xl bg-[#F8F8F6] aspect-[4/5] sm:aspect-[3/4] flex flex-col"
            >
              {/* Görsel */}
              {image ? (
                <div className="absolute inset-0">
                  <Image
                    src={image}
                    alt={`Sepette %${pct} indirim`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                </div>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${cartDiscountGradient(pct)} opacity-20`} />
              )}

              {/* İndirim rozeti */}
              <div className="relative z-10 p-4">
                <div className={`inline-flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-to-br ${cartDiscountGradient(pct)} shadow-lg ring-2 ring-white/40`}>
                  <span className="text-white font-bold text-[8px] tracking-wide uppercase leading-none">Sepette</span>
                  <span className="text-white font-black text-[22px] leading-tight">%{pct}</span>
                  <span className="text-white font-bold text-[8px] tracking-wide uppercase leading-none">İndirim</span>
                </div>
              </div>

              {/* Alt link */}
              <div className="relative z-10 mt-auto p-4">
                <span className="inline-flex items-center gap-1.5 text-white text-[13px] font-semibold drop-shadow">
                  Alışverişe Başla
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}

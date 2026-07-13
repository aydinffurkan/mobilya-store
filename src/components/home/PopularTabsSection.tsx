import { getCategoryProductTabs } from '@/lib/repositories/products'
import ProductTabsCarousel from '@/components/home/ProductTabsCarousel'
import { getSectionVisible } from '@/lib/repositories/settings'

export default async function PopularTabsSection() {
  const [tabs, visible] = await Promise.all([getCategoryProductTabs(6, 12), getSectionVisible('popular_tabs')])

  if (!visible || tabs.length === 0) return null

  return (
    <section className="w-full bg-white py-14 overflow-hidden">

      {/* Başlık — ortalanmış, sayfa içerik genişliğinde */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Sizin Favorileriniz!</h2>
        <p className="text-sm text-neutral-400 mt-2">
          messahome olarak en beğendiğiniz tasarımlarımız!
        </p>
      </div>

      {/* Carousel — tam genişlik, sağ kenarda kesilerek taşar */}
      <ProductTabsCarousel tabs={tabs} />

    </section>
  )
}
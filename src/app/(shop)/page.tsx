export const dynamic = 'force-dynamic'

import HeroSlider from '@/components/home/HeroSlider'
import CategorySection from '@/components/home/CategorySection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import ServicesSection from '@/components/home/ServicesSection'

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <CategorySection />
      <FeaturedProducts />
      <ServicesSection />
    </>
  )
}

export const dynamic = 'force-dynamic'

import HeroSlider from '@/components/home/HeroSlider'
import TrustBand from '@/components/home/TrustBand'
import CategoryBannerGrid from '@/components/home/CategoryBannerGrid'
import CategorySection from '@/components/home/CategorySection'
import PopularTabsSection from '@/components/home/PopularTabsSection'
import CartDiscountSection from '@/components/home/CartDiscountSection'
import ShoppableBanner from '@/components/home/ShoppableBanner'
import Testimonials from '@/components/home/Testimonials'
import ReviewsMarquee from '@/components/home/ReviewsMarquee'
import AboutSection from '@/components/home/AboutSection'
import DesignConsultationSection from '@/components/home/DesignConsultationSection'
import ServicesSection from '@/components/home/ServicesSection'
import BlogSection from '@/components/home/BlogSection'
import PromoBanner from '@/components/home/PromoBanner'
import BeforeAfterSection from '@/components/home/BeforeAfterSection'

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <CategorySection />
      <TrustBand />
      <CategoryBannerGrid />
      <CartDiscountSection />
      <PromoBanner slot="1" />
      <PopularTabsSection />
      <ReviewsMarquee />
      <PromoBanner slot="2" />
      <ShoppableBanner />
      <BeforeAfterSection />
      <Testimonials />
      <BlogSection />
      <PromoBanner slot="3" />
      <AboutSection />
      <DesignConsultationSection />
      <ServicesSection />
    </>
  )
}
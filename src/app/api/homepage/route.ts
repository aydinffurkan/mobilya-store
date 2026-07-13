import { corsOptions, ok } from '@/lib/api/helpers'
import { getSliderSlides, getCategoryShowcaseItems, getShoppableBanner, getTrustStats, getTestimonials, getAboutSection } from '@/lib/repositories/settings'
import { getFeaturedProducts } from '@/lib/repositories/products'

export function OPTIONS() { return corsOptions() }

// Mobil uygulamalar için tek istekte tüm anasayfa verisi
export async function GET() {
  const [
    slider,
    trustStats,
    categoryShowcase,
    featuredProducts,
    shoppableBanner,
    testimonials,
    aboutSection,
  ] = await Promise.all([
    getSliderSlides(),
    getTrustStats(),
    getCategoryShowcaseItems(),
    getFeaturedProducts(8),
    getShoppableBanner(),
    getTestimonials(),
    getAboutSection(),
  ])

  return ok({
    slider,
    trustStats,
    categoryShowcase,
    featuredProducts,
    shoppableBanner,
    testimonials,
    aboutSection,
  })
}
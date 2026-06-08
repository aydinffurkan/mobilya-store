import { createClient } from '@/lib/supabase/server'
import { HeroSlide } from '@/types'
import HeroSliderClient from './HeroSliderClient'

const defaultSlides: HeroSlide[] = [
  {
    image_url: null,
    title: 'Ulaşılabilir Lüks',
    subtitle: 'Yatak Odası Koleksiyonları',
    desc: 'Modern ve klasik çizgilerin buluştuğu özel tasarım mobilyalar. Ücretsiz nakliye ve kurulum.',
    cta_text: 'Koleksiyonu Gör',
    cta_href: '/kategori/yatak-odasi',
  },
]

async function getSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'slider').single()
    const slides = (data?.value as { slides?: HeroSlide[] } | null)?.slides
    return slides && slides.length > 0 ? slides : defaultSlides
  } catch {
    return defaultSlides
  }
}

export default async function HeroSlider() {
  const slides = await getSlides()
  return <HeroSliderClient slides={slides} />
}

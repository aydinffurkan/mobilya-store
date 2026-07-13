import { createAdminClient } from '@/lib/supabase/admin'
import { HeroSlide, CategoryPromoCard, CategoryBanner, SlideHotspot, TrustStat, Testimonial, AboutSectionData, LogoData, DesignConsultationData } from '@/types'

export interface AnalyticsSettings {
  ga_id: string
  fb_pixel_id: string
}

export interface ShoppableBannerData {
  image_url: string | null
  title: string
  subtitle: string
  hotspots: SlideHotspot[]
}

export async function getSliderSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'slider')
      .single()
    return (data?.value as { slides?: HeroSlide[] } | null)?.slides ?? []
  } catch {
    return []
  }
}

export async function getCategoryShowcaseItems(): Promise<CategoryPromoCard[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'category_showcase')
      .single()
    return (data?.value as { items?: CategoryPromoCard[] } | null)?.items ?? []
  } catch {
    return []
  }
}

export async function getShoppableBanner(): Promise<ShoppableBannerData | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'shoppable_banner')
      .single()
    const val = data?.value as ShoppableBannerData | null
    return val?.image_url ? val : null
  } catch {
    return null
  }
}

export async function getLogoSettings(): Promise<LogoData> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'logo')
      .single()
    const val = data?.value as LogoData | null
    return { image_url: val?.image_url ?? null, alt: val?.alt ?? 'Logo' }
  } catch {
    return { image_url: null, alt: 'Logo' }
  }
}

export async function getTrustStats(): Promise<TrustStat[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'trust_stats')
      .single()
    return (data?.value as { stats?: TrustStat[] } | null)?.stats ?? []
  } catch {
    return []
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'testimonials')
      .single()
    return (data?.value as { items?: Testimonial[] } | null)?.items ?? []
  } catch {
    return []
  }
}

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'analytics')
      .single()
    const val = data?.value as AnalyticsSettings | null
    return { ga_id: val?.ga_id ?? '', fb_pixel_id: val?.fb_pixel_id ?? '' }
  } catch {
    return { ga_id: '', fb_pixel_id: '' }
  }
}

export async function getSectionVisible(sectionKey: string, defaultValue = true): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', `${sectionKey}_visible`)
      .single()
    const val = data?.value as { visible?: boolean } | null
    return val?.visible !== false
  } catch {
    return defaultValue
  }
}

export async function getTrustBandVisible(): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'trust_band_visible')
      .single()
    const val = data?.value as { visible?: boolean } | null
    return val?.visible !== false // varsayılan: görünür
  } catch {
    return true
  }
}

export async function getCategoryBanners(): Promise<CategoryBanner[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'category_banners')
      .single()
    return (data?.value as { items?: CategoryBanner[] } | null)?.items ?? []
  } catch {
    return []
  }
}

export async function getAboutSection(): Promise<AboutSectionData | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'about_section')
      .single()
    const val = data?.value as AboutSectionData | null
    return val?.title ? val : null
  } catch {
    return null
  }
}

export async function getDesignConsultation(): Promise<DesignConsultationData | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'design_consultation')
      .single()
    const val = data?.value as DesignConsultationData | null
    return val?.title ? val : null
  } catch {
    return null
  }
}
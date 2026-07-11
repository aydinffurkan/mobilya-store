import { createAdminClient } from '@/lib/supabase/admin'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'
import SliderManager from '@/components/admin/SliderManager'
import CategoryShowcaseManager from '@/components/admin/CategoryShowcaseManager'
import CategoryBannerManager from '@/components/admin/CategoryBannerManager'
import ShoppableBannerManager from '@/components/admin/ShoppableBannerManager'
import TrustStatsManager from '@/components/admin/TrustStatsManager'
import TestimonialsManager from '@/components/admin/TestimonialsManager'
import AboutSectionManager from '@/components/admin/AboutSectionManager'
import DesignConsultationManager from '@/components/admin/DesignConsultationManager'
import LogoManager from '@/components/admin/LogoManager'
import FaviconManager from '@/components/admin/FaviconManager'
import SocialLinksManager from '@/components/admin/SocialLinksManager'
import { HeroSlide, CategoryPromoCard, CategoryBanner, SlideHotspot, TrustStat, Testimonial, AboutSectionData, LogoData, DesignConsultationData } from '@/types'
import { ShoppableBannerData } from '@/app/admin/ayarlar/actions'
import AnalyticsManager from '@/components/admin/AnalyticsManager'
import TopBarManager from '@/components/admin/TopBarManager'
import PromoBannerManager from '@/components/admin/PromoBannerManager'
import type { TopBarData } from '@/components/layout/TopBar'
import type { PromoBannerData } from '@/components/home/PromoBanner'
import PopularTabsManager from '@/components/admin/PopularTabsManager'
import ServicesSectionManager from '@/components/admin/ServicesSectionManager'
import CouponManager from '@/components/admin/CouponManager'
import CartUpsellManager from '@/components/admin/CartUpsellManager'
import ChatbotManager from '@/components/admin/ChatbotManager'
import AnthropicApiKeyManager from '@/components/admin/AnthropicApiKeyManager'
import WhatsAppManager from '@/components/admin/WhatsAppManager'
import QNBPayManager from '@/components/admin/QNBPayManager'
import type { QNBPaySettings } from '@/components/admin/QNBPayManager'
import BeforeAfterManager from '@/components/admin/BeforeAfterManager'
import type { BeforeAfterData } from '@/components/admin/BeforeAfterManager'
import type { WhatsAppSettings } from '@/components/admin/WhatsAppManager'
import { getAnthropicApiKeyMasked } from '@/app/admin/ayarlar/actions'
import { getAnalyticsSettings, getTrustBandVisible, getSectionVisible } from '@/lib/repositories/settings'
import { decryptSecret } from '@/lib/crypto/secrets'
import { CouponDef, ProductSlim, SocialLinks } from '@/app/admin/ayarlar/actions'

export default async function AdminSettingsPage() {
  const adminClient = createAdminClient()
  const [
    { data: heroData },
    { data: contactData },
    { data: sliderData },
    { data: showcaseData },
    { data: categoryBannersData },
    { data: bannerData },
    { data: trustData },
    { data: testimonialsData },
    { data: aboutData },
    { data: logoData },
    { data: faviconData },
    { data: designConsultationData },
    { data: couponsData },
    { data: cartUpsellData },
    { data: socialLinksData },
    { data: topBarData },
    { data: promoBanner1Data },
    { data: promoBanner2Data },
    { data: promoBanner3Data },
    { data: whatsappData },
    { data: beforeAfterData },
    { data: qnbpayData },
  ] = await Promise.all([
    adminClient.from('site_settings').select('value').eq('key', 'hero').single(),
    adminClient.from('site_settings').select('value').eq('key', 'contact').single(),
    adminClient.from('site_settings').select('value').eq('key', 'slider').single(),
    adminClient.from('site_settings').select('value').eq('key', 'category_showcase').single(),
    adminClient.from('site_settings').select('value').eq('key', 'category_banners').single(),
    adminClient.from('site_settings').select('value').eq('key', 'shoppable_banner').single(),
    adminClient.from('site_settings').select('value').eq('key', 'trust_stats').single(),
    adminClient.from('site_settings').select('value').eq('key', 'testimonials').single(),
    adminClient.from('site_settings').select('value').eq('key', 'about_section').single(),
    adminClient.from('site_settings').select('value').eq('key', 'logo').single(),
    adminClient.from('site_settings').select('value').eq('key', 'favicon').single(),
    adminClient.from('site_settings').select('value').eq('key', 'design_consultation').single(),
    adminClient.from('site_settings').select('value').eq('key', 'coupons').single(),
    adminClient.from('site_settings').select('value').eq('key', 'cart_upsell').single(),
    adminClient.from('site_settings').select('value').eq('key', 'social_links').single(),
    adminClient.from('site_settings').select('value').eq('key', 'top_bar').single(),
    adminClient.from('site_settings').select('value').eq('key', 'promo_banner_1').single(),
    adminClient.from('site_settings').select('value').eq('key', 'promo_banner_2').single(),
    adminClient.from('site_settings').select('value').eq('key', 'promo_banner_3').single(),
    adminClient.from('site_settings').select('value').eq('key', 'whatsapp').single(),
    adminClient.from('site_settings').select('value').eq('key', 'before_after').single(),
    adminClient.from('site_settings').select('value').eq('key', 'qnbpay_settings').single(),
  ])

  const [
    analyticsInitial,
    trustBandVisible,
    sliderVisible,
    categoryShowcaseVisible,
    categoryBannersVisible,
    popularTabsVisible,
    shoppableBannerVisible,
    testimonialsVisible,
    aboutSectionVisible,
    designConsultationVisible,
    servicesSectionVisible,
    chatbotVisible,
    anthropicKeyMasked,
  ] = await Promise.all([
    getAnalyticsSettings(),
    getTrustBandVisible(),
    getSectionVisible('slider'),
    getSectionVisible('category_showcase'),
    getSectionVisible('category_banners'),
    getSectionVisible('popular_tabs'),
    getSectionVisible('shoppable_banner'),
    getSectionVisible('testimonials'),
    getSectionVisible('about_section'),
    getSectionVisible('design_consultation'),
    getSectionVisible('services_section'),
    getSectionVisible('chatbot', false),
    getAnthropicApiKeyMasked(),
  ])

  const slides = ((sliderData?.value as { slides?: HeroSlide[] } | null)?.slides) ?? []
  const showcaseItems = ((showcaseData?.value as { items?: CategoryPromoCard[] } | null)?.items) ?? []
  const categoryBanners: CategoryBanner[] = ((categoryBannersData?.value as { items?: CategoryBanner[] } | null)?.items) ?? []

  const bannerInitial: ShoppableBannerData = {
    image_url: (bannerData?.value as { image_url?: string } | null)?.image_url ?? null,
    title: (bannerData?.value as { title?: string } | null)?.title ?? '',
    subtitle: (bannerData?.value as { subtitle?: string } | null)?.subtitle ?? '',
    hotspots: (bannerData?.value as { hotspots?: SlideHotspot[] } | null)?.hotspots ?? [],
  }

  const trustInitial: TrustStat[] = (trustData?.value as { stats?: TrustStat[] } | null)?.stats ?? []
  const testimonialsInitial: Testimonial[] = (testimonialsData?.value as { items?: Testimonial[] } | null)?.items ?? []

  const aboutInitial: AboutSectionData = {
    title: (aboutData?.value as { title?: string } | null)?.title ?? '',
    text: (aboutData?.value as { text?: string } | null)?.text ?? '',
    image_url: (aboutData?.value as { image_url?: string } | null)?.image_url ?? null,
  }

  const logoInitial: LogoData = {
    image_url: (logoData?.value as { image_url?: string } | null)?.image_url ?? null,
    alt: (logoData?.value as { alt?: string } | null)?.alt ?? 'Logo',
  }

  const faviconInitial: string | null = (faviconData?.value as { url?: string } | null)?.url ?? null

  const socialLinksInitial: SocialLinks = (socialLinksData?.value as SocialLinks | null) ?? {}

  const designConsultationInitial: DesignConsultationData = {
    title:     (designConsultationData?.value as { title?: string }    | null)?.title     ?? '',
    text:      (designConsultationData?.value as { text?: string }     | null)?.text      ?? '',
    cta_text:  (designConsultationData?.value as { cta_text?: string }  | null)?.cta_text  ?? 'Randevu Al',
    cta_href:  (designConsultationData?.value as { cta_href?: string }  | null)?.cta_href  ?? '/iletisim',
    phone:     (designConsultationData?.value as { phone?: string }    | null)?.phone     ?? '',
    image_url: (designConsultationData?.value as { image_url?: string } | null)?.image_url ?? null,
  }

  const couponsInitial: CouponDef[] = (couponsData?.value as { items?: CouponDef[] } | null)?.items ?? []

  const whatsappInitial: WhatsAppSettings = {
    enabled: (whatsappData?.value as WhatsAppSettings | null)?.enabled ?? false,
    phone:   (whatsappData?.value as WhatsAppSettings | null)?.phone   ?? '',
    message: (whatsappData?.value as WhatsAppSettings | null)?.message ?? '',
  }

  const beforeAfterInitial: BeforeAfterData = {
    enabled:     (beforeAfterData?.value as BeforeAfterData | null)?.enabled     ?? false,
    title:       (beforeAfterData?.value as BeforeAfterData | null)?.title       ?? '',
    subtitle:    (beforeAfterData?.value as BeforeAfterData | null)?.subtitle    ?? '',
    left_image:  (beforeAfterData?.value as BeforeAfterData | null)?.left_image  ?? '',
    right_image: (beforeAfterData?.value as BeforeAfterData | null)?.right_image ?? '',
    left_label:  (beforeAfterData?.value as BeforeAfterData | null)?.left_label  ?? '',
    right_label: (beforeAfterData?.value as BeforeAfterData | null)?.right_label ?? '',
  }

  const qnbpayInitial: QNBPaySettings = {
    enabled:     (qnbpayData?.value as QNBPaySettings | null)?.enabled      ?? false,
    test_mode:   (qnbpayData?.value as QNBPaySettings | null)?.test_mode    ?? true,
    app_id:      (qnbpayData?.value as QNBPaySettings | null)?.app_id       ?? '',
    app_secret:  decryptSecret((qnbpayData?.value as QNBPaySettings | null)?.app_secret   ?? ''),
    merchant_key:decryptSecret((qnbpayData?.value as QNBPaySettings | null)?.merchant_key ?? ''),
  }

  const makePromoBanner = (d: any): PromoBannerData => ({
    enabled:          d?.enabled          ?? false,
    image_url:        d?.image_url        ?? null,
    mobile_image_url: d?.mobile_image_url ?? null,
    href:             d?.href             ?? '/',
    alt:              d?.alt              ?? '',
  })
  const promoBanner1 = makePromoBanner(promoBanner1Data?.value)
  const promoBanner2 = makePromoBanner(promoBanner2Data?.value)
  const promoBanner3 = makePromoBanner(promoBanner3Data?.value)

  const topBarVal = topBarData?.value as Record<string, any> | null
  const topBarInitial: TopBarData = {
    enabled:    topBarVal?.enabled    ?? true,
    texts:      topBarVal?.texts?.length ? topBarVal.texts : (topBarVal?.text ? [topBarVal.text] : ['Fırsatları Kaçırmayın!', 'Ücretsiz Kargo — 5.000₺ ve Üzeri']),
    interval:   topBarVal?.interval   ?? 4,
    bg_color:   topBarVal?.bg_color   ?? '#1e293b',
    text_color: topBarVal?.text_color ?? '#ffffff',
    links:      topBarVal?.links      ?? [
      { label: 'Blog', href: '/blog' },
      { label: 'İletişim', href: '/iletisim' },
      { label: 'Sipariş Takip', href: '/hesabim' },
    ],
  }

  // Kasa arkası: kaydedilmiş ürün ID'leri → ürün detayları
  const cartUpsellIds: string[] = (cartUpsellData?.value as { product_ids?: string[] } | null)?.product_ids ?? []
  let cartUpsellInitial: ProductSlim[] = []
  if (cartUpsellIds.length > 0) {
    const { data: upsellProducts } = await adminClient
      .from('products')
      .select('id, name, price, images')
      .in('id', cartUpsellIds)
    if (upsellProducts?.length) {
      const byId = new Map(upsellProducts.map((p: { id: string; name: string; price: number; images: string[] }) => [p.id, p]))
      cartUpsellInitial = cartUpsellIds
        .map((id) => {
          const p = byId.get(id) as { id: string; name: string; price: number; images: string[] } | undefined
          return p ? { id: p.id, name: p.name, price: p.price, image: p.images?.[0] ?? null } : null
        })
        .filter(Boolean) as ProductSlim[]
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">Ana sayfa içeriklerini ve iletişim bilgilerini düzenle</p>
      </div>
      <TopBarManager initial={topBarInitial} />
      <QNBPayManager initial={qnbpayInitial} />
      <WhatsAppManager initial={whatsappInitial} />
      <AnthropicApiKeyManager maskedKey={anthropicKeyMasked} />
      <ChatbotManager initialVisible={chatbotVisible} />
      <AnalyticsManager initial={analyticsInitial} />
      <LogoManager initial={logoInitial} />
      <FaviconManager initial={faviconInitial} />
      <SocialLinksManager initial={socialLinksInitial} />
      <div className="space-y-4">
        <div>
          <h2 className="font-bold text-base">Promo Banner Alanları</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Anasayfada bölümler arasına yerleştirilen tam genişlik banner'lar</p>
        </div>
        <PromoBannerManager slot="1" label="Banner 1 — Sepette İndirimler Altı" initial={promoBanner1} />
        <PromoBannerManager slot="2" label="Banner 2 — Kayan Yorumlar Altı" initial={promoBanner2} />
        <PromoBannerManager slot="3" label="Banner 3 — Blog Bölümü Altı" initial={promoBanner3} />
      </div>
      <BeforeAfterManager initial={beforeAfterInitial} />
      <SliderManager slides={slides} initialVisible={sliderVisible} />
      <ShoppableBannerManager initial={bannerInitial} initialVisible={shoppableBannerVisible} />
      <CategoryBannerManager items={categoryBanners} initialVisible={categoryBannersVisible} />
      <CategoryShowcaseManager items={showcaseItems} initialVisible={categoryShowcaseVisible} />
      <PopularTabsManager initialVisible={popularTabsVisible} />
      <TrustStatsManager initial={trustInitial} initialVisible={trustBandVisible} />
      <TestimonialsManager initial={testimonialsInitial} initialVisible={testimonialsVisible} />
      <AboutSectionManager initial={aboutInitial} initialVisible={aboutSectionVisible} />
      <DesignConsultationManager initial={designConsultationInitial} initialVisible={designConsultationVisible} />
      <ServicesSectionManager initialVisible={servicesSectionVisible} />
      <CouponManager initial={couponsInitial} />
      <CartUpsellManager initial={cartUpsellInitial} />
      <SiteSettingsForm hero={heroData?.value ?? {}} contact={contactData?.value ?? {}} />
    </div>
  )
}
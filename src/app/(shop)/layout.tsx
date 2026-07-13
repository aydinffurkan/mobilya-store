import HeaderMegaMenu, { MegaMenuCategory } from '@/components/HeaderMegaMenu'
type NavCategory = MegaMenuCategory
import TopBar from '@/components/layout/TopBar'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import AnalyticsScripts from '@/components/layout/AnalyticsScripts'
import CartPreviewPopup from '@/components/shared/CartPreviewPopup'
import QuickViewModal from '@/components/products/QuickViewModal'
import ChatWidget from '@/components/layout/ChatWidget'
import WhatsAppWidget from '@/components/layout/WhatsAppWidget'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Category, CategoryPromoCard } from '@/types'
import { getLogoSettings, getAnalyticsSettings, getSectionVisible } from '@/lib/repositories/settings'

async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    const categories = (data as Category[]) ?? []
    const parents = categories.filter((c) => !c.parent_id)
    return parents.map((parent) => ({
      name: parent.name,
      slug: parent.slug,
      sub: categories
        .filter((c) => c.parent_id === parent.id)
        .map((c) => ({ name: c.name, slug: c.slug })),
      promoCards: (parent.promo_cards as CategoryPromoCard[]) ?? [],
    }))
  } catch {
    return []
  }
}

async function getWhatsAppSettings() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'whatsapp')
      .single()
    const val = data?.value as { enabled?: boolean; phone?: string; message?: string } | null
    return { enabled: val?.enabled ?? false, phone: val?.phone ?? '', message: val?.message ?? '' }
  } catch {
    return { enabled: false, phone: '', message: '' }
  }
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, logo, analytics, chatbotEnabled, whatsapp] = await Promise.all([
    getNavCategories(),
    getLogoSettings(),
    getAnalyticsSettings(),
    getSectionVisible('chatbot', false),
    getWhatsAppSettings(),
  ])
  return (
    <>
      <div className="sticky top-0 z-50">
        <TopBar />
        <HeaderMegaMenu categories={categories} logoUrl={logo?.image_url} logoAlt={logo?.alt} />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartPreviewPopup />
      <QuickViewModal />
      <CookieBanner />
      <AnalyticsScripts gaId={analytics.ga_id} fbPixelId={analytics.fb_pixel_id} />
      {whatsapp.enabled && whatsapp.phone && (
        <WhatsAppWidget phone={whatsapp.phone} message={whatsapp.message || undefined} />
      )}
      <ChatWidget enabled={chatbotEnabled} />
    </>
  )
}

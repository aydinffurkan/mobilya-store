'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { maybeEncrypt, decryptSecret } from '@/lib/crypto/secrets'
import { HeroSlide, CategoryPromoCard, CategoryBanner, SlideHotspot, TrustStat, Testimonial, AboutSectionData, LogoData, DesignConsultationData } from '@/types'
import { AnalyticsSettings } from '@/lib/repositories/settings'

export interface ShoppableBannerData {
  image_url: string | null
  title: string
  subtitle: string
  hotspots: SlideHotspot[]
}

export async function saveSectionVisible(sectionKey: string, visible: boolean) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: `${sectionKey}_visible`, value: { visible }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveTrustBandVisible(visible: boolean) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'trust_band_visible', value: { visible }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveCategoryBanners(items: CategoryBanner[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'category_banners', value: { items }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveSiteSettings(
  heroData: Record<string, string>,
  contactData: Record<string, string>
) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const [r1, r2] = await Promise.all([
    adminClient.from('site_settings').upsert({ key: 'hero', value: heroData, updated_at: new Date().toISOString() }),
    adminClient.from('site_settings').upsert({ key: 'contact', value: contactData, updated_at: new Date().toISOString() }),
  ])
  if (r1.error || r2.error) throw new Error(r1.error?.message ?? r2.error?.message)
  revalidatePath('/', 'layout')
}

export async function savePromoBanner(slot: string, data: { enabled: boolean; image_url: string | null; mobile_image_url: string | null; href: string; alt: string }) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: `promo_banner_${slot}`, value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function uploadPromoBannerImage(formData: FormData): Promise<string> {
  await requireAdmin()
  const file = formData.get('file') as File
  const slot = formData.get('slot') as string
  if (!file) throw new Error('Dosya bulunamadı')
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `promo-banners/${slot}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const adminClient = createAdminClient()
  const { error } = await adminClient.storage
    .from('product-images')
    .upload(path, buffer, { contentType: file.type, upsert: true })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = adminClient.storage.from('product-images').getPublicUrl(path)
  return publicUrl
}

export async function saveTopBar(data: { enabled: boolean; texts: string[]; interval: number; bg_color: string; text_color: string; links: { label: string; href: string }[] }) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'top_bar', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveHeroSlider(slides: HeroSlide[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'slider', value: { slides }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveCategoryShowcase(items: CategoryPromoCard[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'category_showcase', value: { items }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveShoppableBanner(data: ShoppableBannerData) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'shoppable_banner', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveLogoSettings(data: LogoData) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'logo', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveTrustStats(stats: TrustStat[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'trust_stats', value: { stats }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveTestimonials(items: Testimonial[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'testimonials', value: { items }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveAboutSection(data: AboutSectionData) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'about_section', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveDesignConsultation(data: DesignConsultationData) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'design_consultation', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveAnalyticsSettings(data: AnalyticsSettings) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'analytics', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export interface CouponDef {
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_amount: number
  active: boolean
  expires_at?: string
}

export interface ProductSlim {
  id: string
  name: string
  price: number
  image: string | null
}

export async function searchProductsForUpsell(q: string): Promise<ProductSlim[]> {
  await requireAdmin()
  const adminClient = createAdminClient()
  let query = adminClient
    .from('products')
    .select('id, name, price, images')
    .eq('is_active', true)
    .limit(20)
  if (q.trim()) query = query.ilike('name', `%${q.trim()}%`)
  else query = query.order('name')
  const { data } = await query
  return (data ?? []).map((p: { id: string; name: string; price: number; images: string[] }) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.images?.[0] ?? null,
  }))
}

export async function saveCartUpsell(productIds: string[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'cart_upsell', value: { product_ids: productIds }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export async function saveCoupons(items: CouponDef[]) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'coupons', value: { items }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  youtube?: string
  tiktok?: string
}

export async function saveSocialLinks(data: SocialLinks) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'social_links', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveFavicon(url: string | null) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'favicon', value: { url }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveBeforeAfter(data: {
  enabled: boolean
  title: string
  subtitle: string
  left_image: string
  right_image: string
  left_label: string
  right_label: string
}) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'before_after', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function uploadBeforeAfterImage(formData: FormData): Promise<string> {
  await requireAdmin()
  const file = formData.get('file') as File
  const side = formData.get('side') as string
  if (!file) throw new Error('Dosya bulunamadı')
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `before-after/${side}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const adminClient = createAdminClient()
  const { error } = await adminClient.storage
    .from('product-images')
    .upload(path, buffer, { contentType: file.type, upsert: true })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = adminClient.storage.from('product-images').getPublicUrl(path)
  return publicUrl
}

export async function saveWhatsAppSettings(data: { enabled: boolean; phone: string; message: string }) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'whatsapp', value: data, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function saveAnthropicApiKey(apiKey: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'anthropic_api_key', value: { key: maybeEncrypt(apiKey.trim()) }, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export async function saveQNBPaySettings(data: {
  enabled: boolean
  test_mode: boolean
  app_id: string
  app_secret: string
  merchant_key: string
}) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const stored = {
    ...data,
    app_secret: maybeEncrypt(data.app_secret),
    merchant_key: maybeEncrypt(data.merchant_key),
  }
  const { error } = await adminClient
    .from('site_settings')
    .upsert({ key: 'qnbpay_settings', value: stored, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export async function getAnthropicApiKeyMasked(): Promise<string | null> {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('site_settings')
    .select('value')
    .eq('key', 'anthropic_api_key')
    .single()
  const stored = (data?.value as { key?: string } | null)?.key
  if (!stored) return null
  const key = decryptSecret(stored)
  return key.slice(0, 10) + '...' + key.slice(-4)
}

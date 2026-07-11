-- ============================================================
-- GÜVENLİK DÜZELTMELERİ — Migration
-- Supabase Dashboard > SQL Editor'e yapıştırın ve çalıştırın
-- ============================================================

-- ============================================================
-- 1. Admin RLS politikalarını düzelt
--    "auth.role() = 'authenticated'" HERKESİ kapsar — admin değil!
--    Doğrusu: JWT app_metadata.role = 'admin' kontrolü
-- ============================================================

-- Products
DROP POLICY IF EXISTS "products_admin_write" ON products;
CREATE POLICY "products_admin_write" ON products
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Product Variants
DROP POLICY IF EXISTS "product_variants_admin_write" ON product_variants;
CREATE POLICY "product_variants_admin_write" ON product_variants
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Variant Templates
DROP POLICY IF EXISTS "variant_templates_admin_all" ON variant_templates;
CREATE POLICY "variant_templates_admin_all" ON variant_templates
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 2. Orders INSERT politikasını düzelt
--    Herkes (anon dahil) herhangi bir user_id ile sipariş ekleyebiliyordu
-- ============================================================

DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. Storage politikalarını düzelt
--    Tüm kayıtlı kullanıcılar resim yükleyip silebiliyordu
-- ============================================================

DROP POLICY IF EXISTS "product_images_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;

CREATE POLICY "product_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 4. site_settings — RLS etkinleştir ve şifrele
--    QNBPay credentials ve Anthropic API key burada saklanıyor
-- ============================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Admin her şeyi yapabilsin (okuma + yazma). Yazma yalnızca admin/service-role.
DROP POLICY IF EXISTS "site_settings_admin_all" ON site_settings;
CREATE POLICY "site_settings_admin_all" ON site_settings
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public (anon dahil) yalnızca HASSAS OLMAYAN ayarları OKUYABİLSİN.
-- Vitrin bileşenleri (app/layout SEO+favicon, TopBar, Footer logo/iletişim/
-- sosyal, PromoBanner, HeroSlider, HeroSection) bu ayarları anon client ile
-- okur — bu politika olmadan RLS açılınca vitrin ziyaretçilerde boşalır.
-- Hassas key'ler (ödeme kimlik bilgileri, API anahtarı, kupon kodları) hariç;
-- onlar yalnızca admin/service-role tarafından okunur (ve at-rest şifrelidir).
DROP POLICY IF EXISTS "site_settings_public_read" ON site_settings;
CREATE POLICY "site_settings_public_read" ON site_settings
  FOR SELECT USING (
    key NOT IN ('qnbpay_settings', 'anthropic_api_key', 'coupons')
  );

-- ============================================================
-- 5. newsletter_subscribers — RLS etkinleştir
--    Abone e-posta listesi herkese açıktı (KVKK ihlali)
-- ============================================================

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Kimse doğrudan okuyamasın (sadece admin client via service role)
DROP POLICY IF EXISTS "newsletter_admin_all" ON newsletter_subscribers;
CREATE POLICY "newsletter_admin_all" ON newsletter_subscribers
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Ziyaretçiler abone olabilsin (INSERT only, kendi satırlarını)
DROP POLICY IF EXISTS "newsletter_public_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. faq_templates — RLS etkinleştir
-- ============================================================

ALTER TABLE faq_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faq_templates_admin_all" ON faq_templates;
CREATE POLICY "faq_templates_admin_all" ON faq_templates
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TAMAMLANDI
-- ============================================================

-- ============================================================
-- MobilyaStore – Supabase Veritabanı Şeması
-- Supabase Dashboard > SQL Editor'e yapıştırın ve çalıştırın
-- ============================================================

-- 1. Kategoriler
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ürünler
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  sale_price  NUMERIC(10,2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images      TEXT[] DEFAULT '{}',
  stock       INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Siparişler
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total            NUMERIC(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sipariş Kalemleri
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity   INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Herkes kategorileri okuyabilir
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

-- Herkes aktif ürünleri okuyabilir
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);

-- Authenticated kullanıcılar ürün ekleyip düzenleyebilir (admin)
CREATE POLICY "products_admin_write" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Kullanıcılar kendi siparişlerini görebilir
CREATE POLICY "orders_own_read" ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (true); -- Herkes sipariş verebilir (guest checkout)

CREATE POLICY "order_items_own_read" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Storage bucket (ürün görselleri)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );

-- ============================================================
-- Örnek kategoriler (isteğe bağlı)
-- ============================================================
INSERT INTO categories (name, slug, description) VALUES
  ('Yatak Odası',     'yatak-odasi',     'Yatak odası mobilya takımları'),
  ('Yemek Odası',     'yemek-odasi',     'Yemek odası masa ve sandalye takımları'),
  ('Koltuk & Oturma', 'koltuk-oturma',   'Koltuk takımları ve oturma grupları'),
  ('Genç Odası',      'genc-odasi',      'Genç odası mobilyaları'),
  ('TV Ünitesi',      'tv-unitesi',      'TV sehpası ve üniteleri'),
  ('Bahçe Mobilyası', 'bahce-mobilyasi', 'Dış mekan ve bahçe mobilyaları'),
  ('Dekorasyon',      'dekorasyon',      'Ev dekorasyon ürünleri')
ON CONFLICT (slug) DO NOTHING;

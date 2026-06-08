-- ============================================================
-- Ürün İçeriği Özelleştirme (Bileşenler / Parçalar) — Migration
-- Örn: "Yatak Odası Takımı" -> Yatak, Komodin (x2), Şifonyer
-- Müşteri ürün detay sayfasında parça adetlerini değiştirebilir
-- veya parça kaldırabilir; fiyat farka göre artar/azalır.
-- ============================================================

-- 1. Bileşen tablosu
CREATE TABLE IF NOT EXISTS product_components (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  unit_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  default_quantity INT NOT NULL DEFAULT 1,
  min_quantity     INT NOT NULL DEFAULT 0,
  max_quantity     INT NOT NULL DEFAULT 1,
  stock            INT NOT NULL DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  sort_order       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_components_product_id_idx ON product_components(product_id);

-- 2. Sipariş kalemlerine seçilen içerik konfigürasyonunu kaydetmek için kolon
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS components_config JSONB;

-- 3. RLS politikaları (diğer tablolarla aynı desen)
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_components_public_read" ON product_components
  FOR SELECT USING (is_active = true);

CREATE POLICY "product_components_admin_write" ON product_components
  FOR ALL USING (auth.role() = 'authenticated');

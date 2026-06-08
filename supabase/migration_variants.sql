-- ============================================================
-- Ürün Varyant Sistemi — Migration
-- Supabase Dashboard > SQL Editor'e yapıştırın ve çalıştırın
-- ============================================================

-- 1. Varyant tablosu
-- attributes: esnek key-value etiketler, örn. {"Ayak Rengi": "Siyah", "Kumaş": "Kadife"}
CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  attributes  JSONB DEFAULT '{}',
  price       NUMERIC(10,2),
  sale_price  NUMERIC(10,2),
  stock       INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants(product_id);

-- 2. Sipariş kalemlerine varyant referansı ekle
-- variant_name: sipariş anındaki varyant adının "anlık görüntüsü" (varyant silinse/değişse bile sipariş geçmişinde kalsın)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- 3. RLS — mevcut "products" politikalarıyla aynı desen
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_public_read" ON product_variants
  FOR SELECT USING (is_active = true);

CREATE POLICY "product_variants_admin_write" ON product_variants
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Varyant şablonları
-- Admin panelinde tekrar tekrar aynı varyantı yazmamak için hazır şablon kütüphanesi,
-- örn. ad: "Ayak Rengi", seçenekler: ["Siyah", "Altın", "Gümüş"]
CREATE TABLE IF NOT EXISTS variant_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  options     TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE variant_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variant_templates_admin_all" ON variant_templates
  FOR ALL USING (auth.role() = 'authenticated');

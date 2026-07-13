-- ============================================================
-- Ürün İçeriği (Parça) Şablonları — Migration
-- Çok parçalı ürünler (yatak odası takımı vb.) için, her üründe
-- aynı parçaları tek tek yeniden oluşturmamak amacıyla hazır
-- şablon kütüphanesi. Ürün düzenleme sayfasında bir şablon seçilip
-- "Uygula" denildiğinde, şablondaki parçalar o ürüne toplu olarak
-- (product_components tablosuna) kopyalanır.
--
-- items örneği:
-- [
--   { "name": "Yatak", "unit_price": 8000, "default_quantity": 1, "min_quantity": 1, "max_quantity": 1 },
--   { "name": "Komodin", "unit_price": 1500, "default_quantity": 1, "min_quantity": 0, "max_quantity": 4 },
--   { "name": "Şifonyer", "unit_price": 4000, "default_quantity": 1, "min_quantity": 0, "max_quantity": 1 }
-- ]
-- ============================================================

CREATE TABLE IF NOT EXISTS component_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  items       JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE component_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "component_templates_admin_all" ON component_templates
  FOR ALL USING (auth.role() = 'authenticated');

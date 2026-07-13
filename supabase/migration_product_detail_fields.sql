-- Ürün detay alanları: öne çıkan özellikler, teknik özellik tablosu, ölçü tablosu
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured_specs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specs          JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dimensions     JSONB DEFAULT '[]'::jsonb;
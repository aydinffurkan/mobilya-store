-- ============================================================
-- Kategori Mega Menü Promosyon Kartları — Migration
-- Header'da bir kategorinin üzerine gelindiğinde açılan menüde
-- alt kategorilerin yanında gösterilen görselli promosyon kartları
-- (örn. "Çok Satan Koltuklar", "Hızlı Teslimat Koltuklar")
-- ============================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS promo_cards JSONB DEFAULT '[]'::jsonb;

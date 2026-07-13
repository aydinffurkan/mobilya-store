-- Supabase SQL editöründe çalıştırın
-- (Dashboard → SQL Editor → New Query)

ALTER TABLE products
ADD COLUMN IF NOT EXISTS cart_discount_percent INTEGER DEFAULT NULL;

-- Opsiyonel: sadece geçerli değerlere izin ver
-- ALTER TABLE products
--   ADD CONSTRAINT chk_cart_discount
--   CHECK (cart_discount_percent IS NULL OR cart_discount_percent IN (5, 10, 15, 20));

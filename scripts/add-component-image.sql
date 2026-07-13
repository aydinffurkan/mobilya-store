-- Parça (component) tablosuna görsel URL kolonu ekle
ALTER TABLE product_components ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

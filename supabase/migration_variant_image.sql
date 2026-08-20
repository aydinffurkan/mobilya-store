-- Varyant (ürün seçeneği) başına görsel
-- Supabase Dashboard → SQL Editor'de çalıştırın.
alter table product_variants
  add column if not exists image_url text;

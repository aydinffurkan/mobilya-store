-- Ürün alış fiyatı (maliyet). Kâr hesabı ve marj takibi için.
-- Supabase Dashboard → SQL Editor'de çalıştırın.
alter table products add column if not exists cost_price numeric;

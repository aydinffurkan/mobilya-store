-- Alış fiyatı (maliyet). Kâr hesabı ve marj takibi için — ürün ve parça.
-- Supabase Dashboard → SQL Editor'de çalıştırın.
alter table products add column if not exists cost_price numeric;
alter table product_components add column if not exists cost_price numeric;

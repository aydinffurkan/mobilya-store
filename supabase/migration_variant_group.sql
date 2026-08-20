-- Bağlı ürün grubu (Vivense tarzı seçenekler): aynı gruptaki ürünler
-- birbirinin detay sayfasında "seçenek" olarak görünür, tıklayınca o ürüne gider.
-- variant_group_id: aynı grubun ürünleri aynı değeri paylaşır.
-- variant_group_label: bu ürünün gruptaki etiketi (ör. "190x92", "8 Sandalyeli").
-- Supabase Dashboard → SQL Editor'de çalıştırın.
alter table products add column if not exists variant_group_id text;
alter table products add column if not exists variant_group_label text;
create index if not exists idx_products_variant_group on products(variant_group_id);

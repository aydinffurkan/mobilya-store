-- Son 30 günün en düşük fiyatı (AB Omnibus Direktifi uyumu)
ALTER TABLE products ADD COLUMN IF NOT EXISTS lowest_price_30d NUMERIC(10,2) DEFAULT NULL;

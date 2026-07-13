-- Ürün kartı rozetleri: taksit sayısı ve hızlı teslimat
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS installment_count INTEGER,
  ADD COLUMN IF NOT EXISTS fast_delivery      BOOLEAN DEFAULT false;

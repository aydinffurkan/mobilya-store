-- ============================================================
-- QNBPay Ödeme Entegrasyonu — Migration
-- Supabase Dashboard > SQL Editor'e yapıştırın ve çalıştırın
-- ============================================================

-- 1. Eski status kısıtlamasını kaldır ve yenisini ekle
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'pending',          -- eski varsayılan
      'pending_payment',  -- ödeme formu gönderildi, 3D bekleniyor
      'paid',             -- ödeme başarılı, onaylandı
      'payment_failed',   -- ödeme başarısız veya iptal
      'confirmed',        -- satıcı onayladı
      'shipped',          -- kargo verildi
      'delivered',        -- teslim edildi
      'cancelled'         -- iptal edildi
    )
  );

-- 2. Ödeme referans numarası (QNBPay order_no)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref TEXT;

-- 3. Ödeme zamanı
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

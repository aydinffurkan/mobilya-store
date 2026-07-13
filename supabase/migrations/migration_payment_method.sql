-- orders tablosuna ödeme yöntemi kolonu ekle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';

-- pending_transfer statusu için admin siparişler sayfasında gösterilecek
-- Mevcut siparişlere varsayılan olarak 'card' atanıyor

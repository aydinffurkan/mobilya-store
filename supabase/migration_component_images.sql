-- Parça (component) başına birden fazla görsel
-- Görseller ana ürün galerisinden seçilir (URL referansı) veya yeni yüklenir.
-- image_url kolonu geriye dönük uyumluluk için kalır (= images[1]).

ALTER TABLE product_components ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

-- Mevcut tekil görselleri diziye taşı
UPDATE product_components
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (images IS NULL OR cardinality(images) = 0);

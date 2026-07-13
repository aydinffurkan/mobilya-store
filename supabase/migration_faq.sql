-- SSS şablon tablosu
CREATE TABLE IF NOT EXISTS faq_templates (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  items      JSONB       DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ürünlere SSS alanı
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS faq_items JSONB DEFAULT '[]'::jsonb;
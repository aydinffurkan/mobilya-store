-- Ürün özelliklerine göre filtreleme (Renk / Kapak Adedi / Malzeme)
-- 1) spec_options: hazır seçenek listesi (admin buradan seçer, kirli veri olmaz)
-- 2) products.filter_tags: ürünün filtre etiketleri, örn. {"renk:Beyaz","kapak:3 Kapaklı"}

CREATE TABLE IF NOT EXISTS spec_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_key   TEXT NOT NULL,          -- 'Renk' | 'Malzeme' | 'Kapak Adedi'
  value      TEXT NOT NULL,
  color_hex  TEXT,                   -- sadece Renk için, opsiyonel (#RRGGBB)
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aynı özellikte aynı değer (büyük/küçük harf farkı gözetmeden) bir kez bulunabilir
CREATE UNIQUE INDEX IF NOT EXISTS spec_options_key_value_uniq
  ON spec_options (spec_key, lower(value));

ALTER TABLE spec_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spec_options_public_read" ON spec_options;
CREATE POLICY "spec_options_public_read" ON spec_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "spec_options_admin_write" ON spec_options;
CREATE POLICY "spec_options_admin_write" ON spec_options
  FOR ALL USING (auth.role() = 'authenticated');

-- Kapak adedi seçenekleri hazır gelsin
INSERT INTO spec_options (spec_key, value, sort_order) VALUES
  ('Kapak Adedi', 'Kapaksız',      0),
  ('Kapak Adedi', '1 Kapaklı',     1),
  ('Kapak Adedi', '2 Kapaklı',     2),
  ('Kapak Adedi', '3 Kapaklı',     3),
  ('Kapak Adedi', '4 Kapaklı',     4),
  ('Kapak Adedi', '5 Kapaklı',     5),
  ('Kapak Adedi', '6 Kapaklı',     6),
  ('Kapak Adedi', '8 Kapaklı',     7),
  ('Kapak Adedi', 'Sürgü Kapaklı', 8)
ON CONFLICT DO NOTHING;

-- Ürün filtre etiketleri
ALTER TABLE products ADD COLUMN IF NOT EXISTS filter_tags TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS products_filter_tags_idx ON products USING GIN (filter_tags);

-- Mevcut ürünlerde özelliklere elle yazılmış Renk / Malzeme / Kapak Adedi değerleri varsa
-- etiketlere çevir (virgülle ayrılmış değerler bölünür). Seçenek listesi dışındaki
-- değerler de etiket olur; admin ürünü bir kez kaydedince düzenli hale gelir.
UPDATE products p
SET filter_tags = COALESCE((
  SELECT array_agg(DISTINCT
           CASE lower(s->>'key')
             WHEN 'renk'        THEN 'renk:'
             WHEN 'malzeme'     THEN 'malzeme:'
             WHEN 'kapak adedi' THEN 'kapak:'
           END || btrim(v))
  FROM jsonb_array_elements(COALESCE(p.specs, '[]'::jsonb)) AS s,
       LATERAL unnest(string_to_array(s->>'value', ',')) AS v
  WHERE lower(s->>'key') IN ('renk', 'malzeme', 'kapak adedi')
    AND btrim(v) <> ''
), '{}')
WHERE cardinality(p.filter_tags) = 0;

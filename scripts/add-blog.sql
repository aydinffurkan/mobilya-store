-- Blog posts tablosu
CREATE TABLE IF NOT EXISTS blog_posts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  excerpt       TEXT        DEFAULT '',
  content       TEXT        DEFAULT '',
  cover_image_url TEXT,
  author_name   TEXT        DEFAULT 'Admin',
  category      TEXT        DEFAULT '',
  tags          TEXT[]      DEFAULT '{}',
  read_time     INTEGER     DEFAULT 3,
  is_published  BOOLEAN     DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
-- Sadece yayındaki yazılar herkese açık
DROP POLICY IF EXISTS "Public can read published" ON blog_posts;
CREATE POLICY "Public can read published" ON blog_posts FOR SELECT USING (is_published = true);
-- service_role zaten RLS'i bypass eder, ekstra policy gerekmez

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

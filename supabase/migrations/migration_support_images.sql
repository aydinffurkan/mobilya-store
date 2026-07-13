-- Support tickets'a fotoğraf kolonu ekle
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

-- Storage bucket: destek fotoğrafları
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-images',
  'support-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: giriş yapmış kullanıcı kendi klasörüne yükleyebilir
CREATE POLICY "support_img_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Herkese okuma izni (public bucket)
CREATE POLICY "support_img_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'support-images');

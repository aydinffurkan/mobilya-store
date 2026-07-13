-- ─── Puan işlemleri ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points       INTEGER NOT NULL,           -- pozitif: kazanım, negatif: harcama
  reason       TEXT NOT NULL,              -- 'signup','review','order','manual','converted'
  reference_id TEXT,                       -- ilgili kayıt (order_id, review_id…)
  expires_at   TIMESTAMPTZ,               -- sadece kazanım için (harcamalar NULL)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_points_select" ON user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_points_user_id_idx ON user_points(user_id);
CREATE INDEX IF NOT EXISTS user_points_expires_at_idx ON user_points(expires_at);

-- ─── Hediye çekleri ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_vouchers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT UNIQUE NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,    -- TL değeri
  points_used  INTEGER NOT NULL,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','used','expired')),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  order_id     UUID REFERENCES orders(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_vouchers_select" ON gift_vouchers FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS gift_vouchers_user_id_idx ON gift_vouchers(user_id);
CREATE INDEX IF NOT EXISTS gift_vouchers_code_idx ON gift_vouchers(code);

-- ─── Puan yapılandırması (site_settings'e eklenir, burası sadece varsayılan) ─
-- INSERT INTO site_settings (key, value) VALUES ('points_config', '{
--   "signup_points": 200,
--   "review_points": 150,
--   "validity_days": 180,
--   "points_per_tl": 100,
--   "min_convert": 500,
--   "voucher_validity_days": 365
-- }'::jsonb) ON CONFLICT (key) DO NOTHING;

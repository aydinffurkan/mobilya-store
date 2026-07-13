-- User address book
CREATE TABLE IF NOT EXISTS user_addresses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL DEFAULT 'Adresim',
  full_name    TEXT        NOT NULL DEFAULT '',
  phone        TEXT        NOT NULL DEFAULT '',
  city         TEXT        NOT NULL DEFAULT '',
  district     TEXT        NOT NULL DEFAULT '',
  address      TEXT        NOT NULL DEFAULT '',
  postal_code  TEXT        NOT NULL DEFAULT '',
  is_default   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON user_addresses(user_id);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addr_select" ON user_addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "addr_insert" ON user_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addr_update" ON user_addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addr_delete" ON user_addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

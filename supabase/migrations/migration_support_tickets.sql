CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id    UUID        REFERENCES orders(id) ON DELETE SET NULL,
  type        TEXT        NOT NULL CHECK (type IN ('ariza', 'iade')),
  status      TEXT        NOT NULL DEFAULT 'beklemede'
                          CHECK (status IN ('beklemede', 'inceleniyor', 'cozuldu', 'reddedildi')),
  subject     TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx  ON support_tickets(status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_select" ON support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ticket_insert" ON support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

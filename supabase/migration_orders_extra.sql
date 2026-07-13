ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS carrier         TEXT,
  ADD COLUMN IF NOT EXISTS admin_note      TEXT;
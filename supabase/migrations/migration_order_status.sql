-- orders.status check constraint'ini yeni durumları kapsayacak şekilde genişlet
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'pending_payment',
    'pending_transfer',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
    'payment_failed'
  ));

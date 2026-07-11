import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto/secrets'
import crypto from 'crypto'

export interface QNBPaySettings {
  enabled: boolean
  test_mode: boolean
  app_id: string
  app_secret: string
  merchant_key: string
}

export async function getQNBPaySettings(): Promise<QNBPaySettings | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'qnbpay_settings')
      .single()
    const v = data?.value as QNBPaySettings | null
    if (!v?.app_id || !v?.app_secret || !v?.merchant_key) return null
    // Hassas alanlar at-rest şifreli saklanır — kullanım öncesi çöz
    return {
      ...v,
      app_secret: decryptSecret(v.app_secret),
      merchant_key: decryptSecret(v.merchant_key),
    }
  } catch {
    return null
  }
}

export function baseUrl(testMode: boolean) {
  return testMode
    ? 'https://test.qnbpay.com.tr/ccpayment'
    : 'https://portal.qnbpay.com.tr/ccpayment'
}

export interface TokenResult {
  token: string
  is3d: number  // 0=only2D  1=2D or 3D  2=only3D  4=branded
  expiresAt: string
}

// POST /api/token → { status_code, data: { token, is_3d, expires_at } }
export async function getToken(settings: QNBPaySettings): Promise<TokenResult> {
  const res = await fetch(`${baseUrl(settings.test_mode)}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: settings.app_id, app_secret: settings.app_secret }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`QNBPay token hatası: ${res.status}`)
  const json = await res.json()
  // data can be object or array[0] depending on context
  const item = Array.isArray(json.data) ? json.data[0] : json.data
  const token: string = item?.token ?? item?.data
  if (!token) throw new Error('QNBPay token alınamadı: ' + JSON.stringify(json))
  return { token, is3d: item?.is_3d ?? 2, expiresAt: item?.expires_at ?? '' }
}

// QNBPay hash algorithm (PHP reference):
//   iv = sha1(random)[0:16]
//   salt = sha1(random)[0:4]
//   password = sha1(app_secret)
//   saltWithPassword = sha256(password + salt)
//   encrypted = base64(AES-256-CBC(data, saltWithPassword[0:32], iv))
//   result = "iv:salt:encrypted".replace('/', '__')
export function generateHashKey(data: string, appSecret: string): string {
  const ivFull = crypto.createHash('sha1').update(crypto.randomBytes(8)).digest('hex')
  const saltFull = crypto.createHash('sha1').update(crypto.randomBytes(8)).digest('hex')
  const iv = ivFull.slice(0, 16)    // 16 ASCII chars = 16 bytes for AES IV
  const salt = saltFull.slice(0, 4) // 4 ASCII chars

  const password = crypto.createHash('sha1').update(appSecret, 'utf8').digest('hex')
  const saltWithPassword = crypto.createHash('sha256').update(password + salt, 'utf8').digest('hex')
  const key = saltWithPassword.slice(0, 32) // AES-256 needs 32 bytes; PHP truncates here

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = cipher.update(data, 'utf8', 'base64') + cipher.final('base64')

  return `${iv}:${salt}:${encrypted}`.replace(/\//g, '__')
}

// Payment hash data: total|installment|currency|merchant_key|invoice_id
// total must be pre-formatted as "1500.00" string
export function paymentHashData(
  total: string | number,
  installment: number,
  currency: string,
  merchantKey: string,
  invoiceId: string
): string {
  return `${total}|${installment}|${currency}|${merchantKey}|${invoiceId}`
}

// CheckStatus hash data: invoice_id|merchant_key
export function checkStatusHashData(invoiceId: string, merchantKey: string): string {
  return `${invoiceId}|${merchantKey}`
}

export interface CartItemPayload {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  variant_id?: string | null
  variant_name?: string | null
  components_config?: unknown | null
}

export interface PaymentFormPayload {
  token: string
  orderId: string
  total: number
  installment: number
  shippingData: {
    full_name: string
    email: string
    phone: string
    address: string
    city: string
    district: string
    zip_code: string
  }
  cardNumber: string
  cardHolder: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  items: CartItemPayload[]
  returnUrl: string
  cancelUrl: string
  userIp?: string
}

function esc(v: string | number) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function hidden(name: string, value: string | number) {
  return `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`
}

// Generates an auto-submitting HTML form for paySmart3D.
// MUST be submitted by the browser — docs explicitly forbid AJAX.
export function buildPaymentForm(
  settings: QNBPaySettings,
  p: PaymentFormPayload
): string {
  const endpoint = `${baseUrl(settings.test_mode)}/api/paySmart3D`
  const currency = 'TRY'
  const nameParts = p.shippingData.full_name.trim().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || firstName
  const expYear = p.expiryYear.length === 2 ? '20' + p.expiryYear : p.expiryYear
  // QNBPay requires decimal format — "1500.00" not "1500"
  const totalStr = Number(p.total).toFixed(2)

  const hashData = paymentHashData(totalStr, p.installment, currency, settings.merchant_key, p.orderId)
  const hashKey = generateHashKey(hashData, settings.app_secret)

  const itemsJson = JSON.stringify(
    p.items.map((i) => ({
      name: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
      description: i.variant_name ?? i.product_name,
    }))
  )

  const fields: [string, string | number][] = [
    ['cc_holder_name', p.cardHolder],
    ['cc_no', p.cardNumber.replace(/\s/g, '')],
    ['expiry_month', p.expiryMonth.padStart(2, '0')],
    ['expiry_year', expYear],
    ['cvv', p.cvv],
    ['currency_code', currency],
    ['installments_number', p.installment],
    ['invoice_id', p.orderId],
    ['invoice_description', 'Mobilya Siparişi'],
    ['name', firstName],
    ['surname', lastName],
    ['total', totalStr],
    ['merchant_key', settings.merchant_key],
    ['items', itemsJson],
    ['hash_key', hashKey],
    ['bill_email', p.shippingData.email],
    ['bill_phone', p.shippingData.phone],
    ['bill_address1', p.shippingData.address],
    ['bill_city', p.shippingData.city],
    ['bill_postcode', p.shippingData.zip_code],
    ['bill_country', 'TR'],
    ['transaction_type', 'Auth'],
    ['return_url', p.returnUrl],
    ['cancel_url', p.cancelUrl],
  ]

  if (p.userIp) fields.push(['ip', p.userIp])

  const inputs = fields.map(([n, v]) => hidden(n, v)).join('\n')

  return `
<form id="qnbpay-form" method="POST" action="${esc(endpoint)}">
  ${inputs}
</form>
<script>document.getElementById('qnbpay-form').submit();</script>`
}

// Calls /api/checkstatus to verify payment
export async function checkPaymentStatus(
  settings: QNBPaySettings,
  token: string,
  invoiceId: string
): Promise<{ paid: boolean; transactionId?: string }> {
  try {
    const hashData = checkStatusHashData(invoiceId, settings.merchant_key)
    const hashKey = generateHashKey(hashData, settings.app_secret)

    const res = await fetch(`${baseUrl(settings.test_mode)}/api/checkstatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_key: settings.merchant_key,
        invoice_id: invoiceId,
        include_pending_status: false,
        hash_key: hashKey,
      }),
      cache: 'no-store',
    })
    if (!res.ok) return { paid: false }
    const json = await res.json()
    const item = Array.isArray(json) ? json[0] : (Array.isArray(json.data) ? json.data[0] : json.data ?? json)
    const paymentStatus = item?.payment_status ?? item?.qnbpay_status
    const transactionStatus = item?.transaction_status
    const paid = paymentStatus === 1 || paymentStatus === '1' || transactionStatus === 'Completed'
    return { paid, transactionId: item?.order_id ?? item?.transaction_id }
  } catch {
    return { paid: false }
  }
}

import crypto from 'crypto'

/**
 * site_settings içinde saklanan hassas alanlar (QNBPay app_secret / merchant_key,
 * Anthropic API key) için at-rest şifreleme.
 *
 * AES-256-GCM kullanılır; anahtar env değişkeni SETTINGS_ENCRYPTION_KEY'den gelir
 * (32 byte — 64 hex karakter ya da base64).
 *
 * Geriye dönük uyumluluk: şifrelenmiş değerler `enc:v1:` ön ekiyle işaretlenir.
 * Ön eki olmayan (eski, düz metin) değerler decryptSecret tarafından olduğu gibi
 * döndürülür; böylece migrasyon kademeli olabilir. Şifreleme yalnızca env anahtarı
 * tanımlıysa yapılır (encryptionAvailable), aksi halde çağıran düz metne düşebilir.
 */
const PREFIX = 'enc:v1:'

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY
  if (!raw) throw new Error('SETTINGS_ENCRYPTION_KEY tanımlı değil')
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('SETTINGS_ENCRYPTION_KEY 32 byte olmalı (64 hex ya da base64)')
  }
  return key
}

/** Env'de şifreleme anahtarı tanımlı mı? */
export function encryptionAvailable(): boolean {
  return !!process.env.SETTINGS_ENCRYPTION_KEY
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64')
}

export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) return value // eski düz metin — olduğu gibi döndür
  const key = getKey()
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ct = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

/** Anahtar varsa şifreler, yoksa düz metni döndürür (kademeli geçiş için). */
export function maybeEncrypt(plaintext: string): string {
  return encryptionAvailable() ? encryptSecret(plaintext) : plaintext
}

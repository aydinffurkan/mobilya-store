import { NextRequest } from 'next/server'

/**
 * Basit in-memory sabit pencere (fixed-window) rate limiter.
 *
 * Not: Süreç belleğinde tutulur — tek instance / düşük trafik için yeterlidir.
 * Çok instance'lı (serverless/edge) dağıtımda kalıcı bir store (Redis/Upstash)
 * ile değiştirilmelidir. Yine de tek instance'ta temel kötüye kullanımı engeller.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

// Bellek sızıntısını önlemek için süresi dolan kayıtları ara sıra temizle.
function sweep(now: number) {
  if (buckets.size < 5000) return
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number // saniye
}

/**
 * @param key     Sınırlama anahtarı (ör. `newsletter:1.2.3.4`)
 * @param limit   Pencere başına izin verilen istek sayısı
 * @param windowMs Pencere süresi (ms)
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true, remaining: limit - bucket.count, retryAfter: 0 }
}

/** İstemci IP'sini proxy header'larından güvenli şekilde çıkarır. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

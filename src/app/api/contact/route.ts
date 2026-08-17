import { NextRequest } from 'next/server'
import { created, badRequest, tooManyRequests, corsOptions } from '@/lib/api/helpers'
import { rateLimit, clientIp } from '@/lib/api/rate-limit'
import { sendContactMessage } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  // IP başına 3 mesaj / dakika — form spam'ini sınırlar
  const rl = rateLimit(`contact:${clientIp(req)}`, 3, 60_000)
  if (!rl.allowed) return tooManyRequests(rl.retryAfter)

  const body = await req.json().catch(() => null)

  const name    = typeof body?.name    === 'string' ? body.name.trim()          : ''
  const email   = typeof body?.email   === 'string' ? body.email.trim()          : ''
  const phone   = typeof body?.phone   === 'string' ? body.phone.trim()          : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim()        : ''
  const message = typeof body?.message === 'string' ? body.message.trim()        : ''

  if (name.length < 2)          return badRequest('Lütfen adınızı giriniz')
  if (!EMAIL_RE.test(email))    return badRequest('Geçerli bir e-posta adresi giriniz')
  if (subject.length < 2)       return badRequest('Lütfen bir konu giriniz')
  if (message.length < 10)      return badRequest('Mesajınız en az 10 karakter olmalı')
  if (message.length > 5000)    return badRequest('Mesajınız çok uzun (en fazla 5000 karakter)')

  try {
    await sendContactMessage({ name, email, phone: phone || undefined, subject, message })
  } catch {
    return badRequest('Mesaj gönderilemedi, lütfen daha sonra tekrar deneyin')
  }

  return created({ message: 'Mesajınız alındı' })
}

export function GET() {
  return corsOptions()
}
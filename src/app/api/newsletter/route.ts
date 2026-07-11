import { NextRequest } from 'next/server'
import { ok, created, badRequest, tooManyRequests, corsOptions } from '@/lib/api/helpers'
import { rateLimit, clientIp } from '@/lib/api/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  // IP başına 5 abonelik / dakika — spam ve otomatik kayıt kötüye kullanımını sınırlar
  const rl = rateLimit(`newsletter:${clientIp(req)}`, 5, 60_000)
  if (!rl.allowed) return tooManyRequests(rl.retryAfter)

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const consent = body?.consent === true

  if (!EMAIL_RE.test(email)) return badRequest('Geçerli bir e-posta adresi giriniz')
  if (!consent) return badRequest('Ticari elektronik ileti onayı gerekli')

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('newsletter_subscribers')
    .upsert({ email, consent }, { onConflict: 'email', ignoreDuplicates: true })

  if (error) return badRequest(error.message)
  return created({ email })
}

export async function GET() {
  return ok({ message: 'POST { email, consent } ile bültene kaydolun' })
}

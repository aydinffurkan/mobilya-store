import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/api/rate-limit'
import { decryptSecret } from '@/lib/crypto/secrets'

const SYSTEM_PROMPT = `Sen Türkiye'nin önde gelen mobilya mağazasının yapay zeka asistanısın. Müşterilere Türkçe olarak yardım ediyorsun.

Görevlerin:
- Ürün önerileri ve mobilya seçimi konusunda rehberlik
- Fiyat ve kampanya bilgisi (güncel bilgi için mağazayı aramalarını öner)
- Sipariş, teslimat ve iade süreçleri hakkında genel bilgi
- Ev dekorasyonu ve mobilya yerleşimi için tasarım tavsiyeleri
- Bakım ve temizlik ipuçları

Davranış kuralları:
- Her zaman nazik, samimi ve profesyonel ol
- Kısa ve öz cevaplar ver — maksimum 3-4 cümle
- Türkçe konuş, resmi ama sıcak bir üslup kullan
- Kesin fiyat veya stok bilgisi bilmiyorsan müşteriyi mağazayla iletişime yönlendir
- Mobilya dışı konularda nazikçe konu dışı olduğunu belirt`

async function getApiKey(): Promise<string | null> {
  // Önce env var'a bak (geliştirme ortamı için)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  // Sonra veritabanına bak (admin panelden girilmiş)
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'anthropic_api_key')
      .single()
    const stored = (data?.value as { key?: string } | null)?.key
    return stored ? decryptSecret(stored) : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication — prevents unauthenticated API key abuse
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Oturum açmanız gerekiyor', { status: 401 })
    }

    // Kullanıcı başına 15 mesaj / dakika — API anahtarı token tüketimini sınırlar
    const rl = rateLimit(`chat:${user.id}`, 15, 60_000)
    if (!rl.allowed) {
      return new Response('Çok fazla istek, lütfen biraz bekleyin', {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      })
    }

    const { messages } = await req.json() as { messages: Anthropic.MessageParam[] }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Geçersiz istek', { status: 400 })
    }

    // Limit conversation length to prevent token abuse
    if (messages.length > 20) {
      return new Response('Çok fazla mesaj', { status: 400 })
    }

    const apiKey = await getApiKey()
    if (!apiKey) {
      return new Response('API anahtarı tanımlanmamış', { status: 503 })
    }

    const client = new Anthropic({ apiKey })

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[chat] error:', err)
    return new Response('Bir hata oluştu', { status: 500 })
  }
}

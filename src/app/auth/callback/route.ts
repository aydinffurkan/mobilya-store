import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Açık yönlendirmeyi önle: yalnızca tek '/' ile başlayan site-içi göreli yola izin ver
  // ('//evil.com' veya '/\evil.com' gibi protokol-göreli hedefleri reddet).
  const nextParam = searchParams.get('next') ?? '/'
  const next = /^\/(?![/\\])/.test(nextParam) ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Hoşgeldin MessaPuanı — Google OAuth + e-posta onayı akışını kapsar (idempotent)
    if (data.session?.user?.id) {
      const userId = data.session.user.id
      void (async () => {
        try {
          const { awardPoints, getPointsConfig } = await import('@/lib/points')
          const config = await getPointsConfig()
          await awardPoints(userId, 'signup', config.signup_points)
        } catch { /* puan hatası redirect'i bloklamasın */ }
      })()
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
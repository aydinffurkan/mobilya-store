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
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
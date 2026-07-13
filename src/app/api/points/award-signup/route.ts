import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPointsConfig } from '@/lib/points'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const admin = createAdminClient()

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { count } = await admin
    .from('user_points')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('reason', 'signup')

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, message: 'Already awarded' })
  }

  const config = await getPointsConfig()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.validity_days)

  const { error: insertError } = await admin.from('user_points').insert({
    user_id: user.id,
    points: config.signup_points,
    reason: 'signup',
    reference_id: null,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, points: config.signup_points })
}

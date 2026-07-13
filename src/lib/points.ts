import { createAdminClient } from '@/lib/supabase/admin'

export interface PointsConfig {
  signup_points: number
  review_points: number
  order_tl_interval: number   // her kaç TL'de bir
  order_points: number        // kaç MessaPuan verilecek
  validity_days: number
  points_per_tl: number
  min_convert: number
  voucher_validity_days: number
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  signup_points: 200,
  review_points: 150,
  order_tl_interval: 100,
  order_points: 50,
  validity_days: 180,
  points_per_tl: 100,
  min_convert: 500,
  voucher_validity_days: 365,
}

export async function getPointsConfig(): Promise<PointsConfig> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'points_config')
      .single()
    if (!data) return DEFAULT_POINTS_CONFIG
    return { ...DEFAULT_POINTS_CONFIG, ...(data.value as Partial<PointsConfig>) }
  } catch {
    return DEFAULT_POINTS_CONFIG
  }
}

export async function redeemVoucher(
  code: string,
  userId: string,
  orderId: string,
  markUsed: boolean,
): Promise<number> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('gift_vouchers')
    .select('id, amount, status, expires_at, user_id')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (error || !data) throw new Error('Hediye çeki bulunamadı')
  if (data.user_id !== userId) throw new Error('Bu hediye çeki size ait değil')
  if (data.status !== 'active') throw new Error('Bu hediye çeki zaten kullanılmış veya süresi dolmuş')
  if (data.expires_at < now) throw new Error('Hediye çekinin süresi dolmuş')

  const updates: Record<string, unknown> = { order_id: orderId }
  if (markUsed) {
    updates.status = 'used'
    updates.used_at = now
  }
  await admin.from('gift_vouchers').update(updates).eq('id', data.id)

  return Math.round(Number(data.amount) * 100) / 100
}

export async function awardPoints(
  userId: string,
  reason: string,
  points: number,
  referenceId?: string,
): Promise<void> {
  const config = await getPointsConfig()
  const admin = createAdminClient()

  if (reason === 'signup') {
    const { count } = await admin
      .from('user_points')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', 'signup')
    if ((count ?? 0) > 0) return
  }

  if (reason === 'order' && referenceId) {
    const { count } = await admin
      .from('user_points')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', 'order')
      .eq('reference_id', referenceId)
    if ((count ?? 0) > 0) return
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.validity_days)

  await admin.from('user_points').insert({
    user_id: userId,
    points,
    reason,
    reference_id: referenceId ?? null,
    expires_at: expiresAt.toISOString(),
  })
}

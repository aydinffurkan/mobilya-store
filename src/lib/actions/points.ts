'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPointsConfig as getConfig } from '@/lib/points'

export type { PointsConfig } from '@/lib/points'

export interface PointRecord {
  id: string
  points: number
  reason: string
  reference_id: string | null
  expires_at: string | null
  created_at: string
}

export interface Voucher {
  id: string
  code: string
  amount: number
  points_used: number
  status: 'active' | 'used' | 'expired'
  expires_at: string
  used_at: string | null
  created_at: string
}

export interface PointsSummary {
  balance: number
  history: PointRecord[]
  config: { points_per_tl: number; min_convert: number; validity_days: number }
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum açılmamış')
  return user.id
}

export async function getMyPoints(): Promise<PointsSummary> {
  const userId = await getCurrentUserId()
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  const history = (data ?? []) as PointRecord[]

  const balance = history.reduce((sum, row) => {
    if (row.points > 0 && row.expires_at && row.expires_at < now) return sum
    return sum + row.points
  }, 0)

  const config = await getConfig()

  return {
    balance: Math.max(0, balance),
    history,
    config: {
      points_per_tl: config.points_per_tl,
      min_convert: config.min_convert,
      validity_days: config.validity_days,
    },
  }
}

export async function getMyVouchers(): Promise<Voucher[]> {
  const userId = await getCurrentUserId()
  const supabase = await createClient()
  const now = new Date().toISOString()

  await supabase
    .from('gift_vouchers')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('expires_at', now)

  const { data, error } = await supabase
    .from('gift_vouchers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Voucher[]
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'GC-'
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

export async function convertPointsToVoucher(
  pointsToConvert: number,
): Promise<{ code: string; amount: number }> {
  const userId = await getCurrentUserId()
  const config = await getConfig()

  if (pointsToConvert < config.min_convert) {
    throw new Error(`Minimum ${config.min_convert} puan ile dönüşüm yapılabilir`)
  }
  if (pointsToConvert % config.min_convert !== 0) {
    throw new Error(`Puan miktarı ${config.min_convert}'nin katı olmalıdır`)
  }

  const { balance } = await getMyPoints()
  if (balance < pointsToConvert) {
    throw new Error('Yeterli puanınız bulunmuyor')
  }

  const amount = pointsToConvert / config.points_per_tl

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.voucher_validity_days)

  const code = generateVoucherCode()
  const admin = createAdminClient()

  const { error: vError } = await admin.from('gift_vouchers').insert({
    user_id: userId,
    code,
    amount,
    points_used: pointsToConvert,
    status: 'active',
    expires_at: expiresAt.toISOString(),
  })
  if (vError) throw new Error(vError.message)

  const { error: pError } = await admin.from('user_points').insert({
    user_id: userId,
    points: -pointsToConvert,
    reason: 'converted',
    reference_id: code,
    expires_at: null,
  })
  if (pError) throw new Error(pError.message)

  return { code, amount }
}

export async function validateVoucher(
  code: string,
): Promise<{ id: string; code: string; amount: number }> {
  const userId = await getCurrentUserId()
  const now = new Date().toISOString()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gift_vouchers')
    .select('id, code, amount, status, expires_at')
    .eq('code', code.trim().toUpperCase())
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', now)
    .single()

  if (error || !data) throw new Error('Geçersiz veya süresi dolmuş hediye çeki')
  return { id: data.id, code: data.code as string, amount: Math.round(Number(data.amount) * 100) / 100 }
}

export { getConfig as getPointsConfig }

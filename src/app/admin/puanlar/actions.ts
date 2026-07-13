'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getPointsConfig, DEFAULT_POINTS_CONFIG, type PointsConfig } from '@/lib/points'
import { revalidatePath } from 'next/cache'

export async function savePointsConfig(config: PointsConfig): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('site_settings')
    .upsert({ key: 'points_config', value: config as unknown as Record<string, unknown> }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/puanlar')
}

export async function findUserByEmail(
  email: string,
): Promise<{ id: string; full_name: string; email: string; balance: number } | null> {
  const admin = createAdminClient()

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const now = new Date().toISOString()
  const { data: rows } = await admin
    .from('user_points')
    .select('points, expires_at')
    .eq('user_id', user.id)

  const balance = (rows ?? []).reduce((sum, row) => {
    if (row.points > 0 && row.expires_at && row.expires_at < now) return sum
    return sum + row.points
  }, 0)

  return {
    id: user.id,
    full_name: profile?.full_name ?? '',
    email: user.email ?? '',
    balance: Math.max(0, balance),
  }
}

export async function awardManualPoints(
  userId: string,
  points: number,
  note: string,
): Promise<void> {
  const config = await getPointsConfig()
  const admin = createAdminClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.validity_days)

  const { error } = await admin.from('user_points').insert({
    user_id: userId,
    points,
    reason: 'manual',
    reference_id: note.trim() || null,
    expires_at: points > 0 ? expiresAt.toISOString() : null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/puanlar')
}

export interface UserBalance {
  user_id: string
  email: string
  full_name: string
  balance: number
  total_earned: number
  last_activity: string
}

export async function getUserBalances(): Promise<UserBalance[]> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: rows } = await admin
    .from('user_points')
    .select('user_id, points, expires_at, created_at')
    .order('created_at', { ascending: false })

  if (!rows || rows.length === 0) return []

  const userIds = [...new Set(rows.map((r) => r.user_id))]

  const [{ data: profiles }, { data: { users } }] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('id', userIds),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? '']))
  const emailMap   = new Map(users.map((u) => [u.id, u.email ?? '']))

  const balanceMap = new Map<string, { balance: number; totalEarned: number; lastActivity: string }>()

  for (const row of rows) {
    const entry = balanceMap.get(row.user_id) ?? { balance: 0, totalEarned: 0, lastActivity: row.created_at }
    const expired = row.points > 0 && row.expires_at && row.expires_at < now
    if (!expired) entry.balance += row.points
    if (row.points > 0) entry.totalEarned += row.points
    if (row.created_at > entry.lastActivity) entry.lastActivity = row.created_at
    balanceMap.set(row.user_id, entry)
  }

  return [...balanceMap.entries()]
    .map(([userId, data]) => ({
      user_id:       userId,
      email:         emailMap.get(userId) ?? '—',
      full_name:     profileMap.get(userId) ?? '—',
      balance:       Math.max(0, data.balance),
      total_earned:  data.totalEarned,
      last_activity: data.lastActivity,
    }))
    .sort((a, b) => b.balance - a.balance)
}

export interface PointTransaction {
  id: string
  user_id: string
  email: string
  full_name: string
  points: number
  reason: string
  reference_id: string | null
  expires_at: string | null
  created_at: string
}

export async function getRecentTransactions(limit = 50): Promise<PointTransaction[]> {
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('user_points')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!rows || rows.length === 0) return []

  const userIds = [...new Set(rows.map((r) => r.user_id))]

  const [{ data: profiles }, { data: { users } }] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('id', userIds),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? '']))
  const emailMap   = new Map(users.map((u) => [u.id, u.email ?? '']))

  return rows.map((row) => ({
    ...row,
    email:     emailMap.get(row.user_id) ?? '—',
    full_name: profileMap.get(row.user_id) ?? '—',
  }))
}

export { getPointsConfig }

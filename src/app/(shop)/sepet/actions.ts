'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface CouponDef {
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_amount: number
  active: boolean
  expires_at?: string
}

export interface CouponResult {
  valid: boolean
  code?: string
  type?: 'percent' | 'fixed'
  value?: number
  minAmount?: number
  error?: string
}

export async function validateCoupon(code: string, cartTotal: number): Promise<CouponResult> {
  const trimmed = code.trim()
  if (!trimmed) return { valid: false, error: 'Kupon kodu boş olamaz' }

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('site_settings')
    .select('value')
    .eq('key', 'coupons')
    .single()

  const coupons: CouponDef[] = (data?.value as { items?: CouponDef[] } | null)?.items ?? []

  const coupon = coupons.find(
    (c) => c.code.toLowerCase() === trimmed.toLowerCase() && c.active !== false
  )

  if (!coupon) {
    // Hediye çeki mi? (GC- ile başlayan kodlar)
    if (trimmed.toUpperCase().startsWith('GC-')) {
      const userClient = await createClient()
      const { data: { user } } = await userClient.auth.getUser()
      if (!user) return { valid: false, error: 'Hediye çeki kullanmak için giriş yapmalısınız' }

      const now = new Date().toISOString()
      const { data: voucher } = await adminClient
        .from('gift_vouchers')
        .select('code, amount, status, expires_at, user_id')
        .eq('code', trimmed.toUpperCase())
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', now)
        .single()

      if (!voucher) return { valid: false, error: 'Geçersiz veya süresi dolmuş hediye çeki' }

      return {
        valid: true,
        code: voucher.code as string,
        type: 'fixed',
        value: Math.round(Number(voucher.amount) * 100) / 100,
        minAmount: 0,
      }
    }

    return { valid: false, error: 'Geçersiz veya kullanılamayan kupon kodu' }
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'Bu kupon kodunun süresi dolmuş' }
  }

  const minAmount = coupon.min_amount ?? 0
  if (cartTotal < minAmount) {
    return {
      valid: false,
      error: `Bu kupon için en az ${minAmount.toLocaleString('tr-TR')} ₺ tutarında sepet gerekli`,
    }
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minAmount,
  }
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CouponState {
  code: string | null
  type: 'percent' | 'fixed' | null
  value: number
  minAmount: number
  apply: (code: string, type: 'percent' | 'fixed', value: number, minAmount: number) => void
  clear: () => void
  discountAmount: (subtotal: number) => number
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      code: null,
      type: null,
      value: 0,
      minAmount: 0,

      apply: (code, type, value, minAmount) =>
        set({ code, type, value, minAmount }),

      clear: () => set({ code: null, type: null, value: 0, minAmount: 0 }),

      discountAmount: (subtotal) => {
        const { code, type, value } = get()
        if (!code || !type || !value) return 0
        return type === 'percent'
          ? Math.round(subtotal * value / 100)
          : Math.min(value, subtotal)
      },
    }),
    { name: 'mobilya-coupon' }
  )
)

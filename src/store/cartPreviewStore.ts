import { create } from 'zustand'
import { Product, ProductVariant } from '@/types'

export interface CartPreviewItem {
  product: Product
  variant?: ProductVariant | null
  quantity: number
  unitPrice: number
}

interface CartPreviewState {
  item: CartPreviewItem | null
  show: (item: CartPreviewItem) => void
  hide: () => void
}

export const useCartPreviewStore = create<CartPreviewState>((set) => ({
  item: null,
  show: (item) => set({ item }),
  hide: () => set({ item: null }),
}))
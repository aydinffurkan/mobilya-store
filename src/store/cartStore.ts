import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductVariant, SelectedComponent } from '@/types'

const componentsSignature = (components?: SelectedComponent[]) =>
  components && components.length > 0
    ? components
        .map((c) => `${c.component_id}:${c.quantity}`)
        .sort()
        .join(',')
    : ''

const itemKey = (productId: string, variantId?: string | null, components?: SelectedComponent[]) =>
  `${productId}::${variantId ?? ''}::${componentsSignature(components)}`

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, variant?: ProductVariant, components?: SelectedComponent[]) => void
  removeItem: (productId: string, variantId?: string | null, components?: SelectedComponent[]) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string | null, components?: SelectedComponent[]) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, variant, components) => {
        set((state) => {
          const key = itemKey(product.id, variant?.id, components)
          const existing = state.items.find((i) => itemKey(i.product.id, i.variant?.id, i.components) === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.product.id, i.variant?.id, i.components) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, quantity, variant, components }] }
        })
      },

      removeItem: (productId, variantId, components) => {
        const key = itemKey(productId, variantId, components)
        set((state) => ({
          items: state.items.filter((i) => itemKey(i.product.id, i.variant?.id, i.components) !== key),
        }))
      },

      updateQuantity: (productId, quantity, variantId, components) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId, components)
          return
        }
        const key = itemKey(productId, variantId, components)
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.product.id, i.variant?.id, i.components) === key ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => {
          // Üründe özelleştirilebilir parça varsa fiyat seçili parçaların toplamından
          // (birim fiyat × adet) gelir; yoksa ürünün/varyantın kendi fiyatı kullanılır.
          const unitPrice = i.components && i.components.length > 0
            ? i.components.reduce((cSum, c) => cSum + c.quantity * c.unit_price, 0)
            : i.variant?.price != null
              ? (i.variant.sale_price ?? i.variant.price)
              : (i.product.sale_price ?? i.product.price)
          return sum + unitPrice * i.quantity
        }, 0),
    }),
    { name: 'mobilya-cart' }
  )
)

export { itemKey }

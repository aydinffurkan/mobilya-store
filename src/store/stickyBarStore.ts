import { create } from 'zustand'

/** Sayfanın altına yapışık bir CTA çubuğu (ör. mobil "Sepete Ekle") görünürken
 *  true olur — WhatsApp gibi sabit köşe widget'ları çakışmamak için yukarı kayar. */
interface StickyBarState {
  visible: boolean
  setVisible: (v: boolean) => void
}

export const useStickyBarStore = create<StickyBarState>((set) => ({
  visible: false,
  setVisible: (v) => set({ visible: v }),
}))

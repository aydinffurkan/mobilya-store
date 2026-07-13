import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  ids: string[]
  toggle: (id: string) => void
  isFavorite: (id: string) => boolean
  total: () => number
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((i) => i !== id)
            : [...state.ids, id],
        })),
      isFavorite: (id) => get().ids.includes(id),
      total: () => get().ids.length,
    }),
    { name: 'mobilya-favorites' }
  )
)
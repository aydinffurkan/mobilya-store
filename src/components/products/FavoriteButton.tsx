'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useFavoritesStore } from '@/store/favoritesStore'
import { cn } from '@/lib/utils'

interface Props {
  productId: string
  className?: string
  size?: number
}

export default function FavoriteButton({ productId, className, size = 15 }: Props) {
  const [mounted, setMounted] = useState(false)
  const toggle     = useFavoritesStore((s) => s.toggle)
  const isFavorite = useFavoritesStore((s) => s.isFavorite)

  useEffect(() => setMounted(true), [])

  const isFav = mounted && isFavorite(productId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(productId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      className={cn(
        'p-1.5 rounded-full bg-white/90 shadow-sm transition-all duration-200 hover:scale-110 active:scale-95',
        className
      )}
    >
      <Heart
        size={size}
        className={cn(
          'transition-colors duration-200',
          isFav ? 'fill-red-500 text-red-500' : 'text-neutral-400 hover:text-red-400'
        )}
      />
    </button>
  )
}
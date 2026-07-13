export function cartDiscountGradient(pct: number): string {
  if (pct >= 20) return 'from-red-500 to-rose-600'
  if (pct >= 15) return 'from-purple-500 to-violet-600'
  if (pct >= 10) return 'from-amber-400 to-orange-500'
  return 'from-teal-400 to-emerald-500'
}

export function cartDiscountTextColor(pct: number): string {
  if (pct >= 20) return 'text-red-500'
  if (pct >= 15) return 'text-purple-500'
  if (pct >= 10) return 'text-orange-500'
  return 'text-teal-500'
}

// Küçük pill rozeti için bg + text + border
export function cartDiscountBadgeColors(pct: number): string {
  if (pct >= 20) return 'text-red-600 bg-red-50 border-red-200'
  if (pct >= 15) return 'text-purple-600 bg-purple-50 border-purple-200'
  if (pct >= 10) return 'text-orange-500 bg-orange-50 border-orange-200'
  return 'text-teal-600 bg-teal-50 border-teal-200'
}

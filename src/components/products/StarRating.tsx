import { Star } from 'lucide-react'

export default function StarRating({
  value,
  size = 14,
  className = '',
}: {
  value: number
  size?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-[#222222] text-[#222222]' : 'fill-neutral-200 text-neutral-200'}
        />
      ))}
    </div>
  )
}
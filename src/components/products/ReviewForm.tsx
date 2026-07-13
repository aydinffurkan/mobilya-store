'use client'

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitReview, deleteReview } from '@/lib/actions/reviews'

interface ExistingReview {
  id: string
  rating: number
  comment: string | null
}

interface Props {
  productId: string
  existingReview: ExistingReview | null
}

export default function ReviewForm({ productId, existingReview }: Props) {
  const [rating, setRating]       = useState(existingReview?.rating ?? 0)
  const [hover, setHover]         = useState(0)
  const [comment, setComment]     = useState(existingReview?.comment ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing]     = useState(!existingReview)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Lütfen bir puan seçin')
      return
    }
    setSubmitting(true)
    try {
      await submitReview(productId, rating, comment)
      toast.success(existingReview ? 'Yorumunuz güncellendi' : 'Yorumunuz yayınlandı')
      setEditing(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingReview) return
    if (!confirm('Yorumunuzu silmek istediğinize emin misiniz?')) return
    setSubmitting(true)
    try {
      await deleteReview(existingReview.id)
      toast.success('Yorumunuz silindi')
      setRating(0)
      setComment('')
      setEditing(true)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  if (!editing && existingReview) {
    return (
      <div className="border border-neutral-100 rounded-2xl p-5 bg-[#FAF8F4]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-800">Yorumunuz</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(true)} className="text-xs text-[#222222] hover:underline">
              Düzenle
            </button>
            <button onClick={handleDelete} disabled={submitting} className="text-xs text-red-500 hover:underline disabled:opacity-50">
              Sil
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={16} className={i <= rating ? 'fill-[#222222] text-[#222222]' : 'fill-neutral-200 text-neutral-200'} />
          ))}
        </div>
        {comment && <p className="text-sm text-neutral-600">{comment}</p>}
      </div>
    )
  }

  return (
    <div className="border border-neutral-200 rounded-2xl p-5">
      <p className="text-sm font-semibold text-neutral-800 mb-3">
        {existingReview ? 'Yorumunuzu Düzenleyin' : 'Bu ürünü değerlendirin'}
      </p>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            className="p-0.5"
          >
            <Star
              size={26}
              className={(hover || rating) >= i ? 'fill-[#222222] text-[#222222]' : 'fill-neutral-200 text-neutral-200'}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Deneyiminizi paylaşın (opsiyonel)"
        rows={3}
        className="w-full text-sm resize-none rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#222222]/20 focus:border-[#222222]/40 transition-all"
      />

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#222222] text-white text-sm font-medium rounded-full hover:bg-[#222222] transition-colors disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {existingReview ? 'Güncelle' : 'Yorumu Gönder'}
        </button>
        {existingReview && (
          <button onClick={() => setEditing(false)} className="text-sm text-neutral-500 hover:text-neutral-800">
            Vazgeç
          </button>
        )}
      </div>
    </div>
  )
}
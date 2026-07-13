import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProductReviews, getUserReviewForProduct } from '@/lib/repositories/reviews'
import StarRating from '@/components/products/StarRating'
import ReviewForm from '@/components/products/ReviewForm'

export default async function ProductReviews({ productId }: { productId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ reviews, stats }, existingReview] = await Promise.all([
    getProductReviews(productId),
    user ? getUserReviewForProduct(productId, user.id) : Promise.resolve(null),
  ])

  return (
    <section className="mt-16 pt-12 border-t border-neutral-100">
      <h2 className="text-xl font-bold text-neutral-900 mb-8">Müşteri Yorumları</h2>

      <div className="grid lg:grid-cols-3 gap-10">

        {/* Sol — özet ve form */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <p className="text-5xl font-bold text-neutral-900">{stats.average.toFixed(1)}</p>
            <StarRating value={stats.average} size={18} className="justify-center lg:justify-start mt-2" />
            <p className="text-sm text-neutral-400 mt-1">{stats.count} değerlendirme</p>
          </div>

          {stats.count > 0 && (
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5]
                const pct = stats.count > 0 ? (count / stats.count) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-3">{star}</span>
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#222222] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          {user ? (
            <ReviewForm productId={productId} existingReview={existingReview} />
          ) : (
            <div className="border border-neutral-100 rounded-2xl p-5 bg-[#FAF8F4] text-sm text-neutral-600">
              Yorum yapmak için{' '}
              <Link href="/auth/giris" className="text-[#222222] font-medium hover:underline">
                giriş yapın
              </Link>
              .
            </div>
          )}
        </div>

        {/* Sağ — yorum listesi */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-sm text-neutral-400 py-10 text-center lg:text-left">
              Henüz değerlendirme yapılmamış. İlk yorumu siz yazın!
            </p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border-b border-neutral-100 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-neutral-800">{r.author_name}</p>
                  <p className="text-xs text-neutral-400">
                    {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <StarRating value={r.rating} size={13} />
                {r.comment && <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
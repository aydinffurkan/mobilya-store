import { createClient } from '@/lib/supabase/server'
import { Review } from '@/types'

export interface ReviewStats {
  average: number
  count: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

const emptyStats = (): ReviewStats => ({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })

export async function getProductReviews(productId: string): Promise<{ reviews: Review[]; stats: ReviewStats }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    const list = data ?? []
    const userIds = [...new Set(list.map((r) => r.user_id))]

    let nameByUser: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
      nameByUser = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name as string]))
    }

    const reviews: Review[] = list.map((r) => ({ ...r, author_name: nameByUser[r.user_id] || 'Müşteri' }))

    const stats = emptyStats()
    let sum = 0
    for (const r of reviews) {
      sum += r.rating
      const key = r.rating as 1 | 2 | 3 | 4 | 5
      if (stats.distribution[key] !== undefined) stats.distribution[key] += 1
    }
    stats.count = reviews.length
    stats.average = reviews.length > 0 ? sum / reviews.length : 0

    return { reviews, stats }
  } catch {
    return { reviews: [], stats: emptyStats() }
  }
}

export async function getUserReviewForProduct(productId: string, userId: string): Promise<Review | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle()
    return (data as Review) ?? null
  } catch {
    return null
  }
}
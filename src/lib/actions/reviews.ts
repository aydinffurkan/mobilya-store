'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitReview(productId: string, rating: number, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Yorum yapmak için giriş yapmalısınız')
  if (rating < 1 || rating > 5) throw new Error('Geçersiz puan')

  const { error } = await supabase
    .from('reviews')
    .upsert(
      { product_id: productId, user_id: user.id, rating, comment: comment.trim() || null },
      { onConflict: 'product_id,user_id' }
    )
  if (error) throw new Error(error.message)

  revalidatePath('/urunler/[slug]', 'page')
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum açık değil')

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/urunler/[slug]', 'page')
}
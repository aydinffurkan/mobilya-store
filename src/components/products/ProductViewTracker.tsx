'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProductViewTracker({ productId }: { productId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      await supabase.from('product_views').insert({
        user_id: data.user.id,
        product_id: productId,
        viewed_at: new Date().toISOString(),
      })
    })
  }, [productId])

  return null
}

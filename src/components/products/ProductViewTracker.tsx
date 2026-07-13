'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const LS_KEY = 'recently_viewed'
const MAX_ITEMS = 8

function saveToLocalStorage(productId: string) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_ITEMS)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {}
}

export default function ProductViewTracker({ productId }: { productId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Always persist to localStorage (works for guests too)
    saveToLocalStorage(productId)

    // Also record in Supabase for logged-in users
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
'use server'

import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'

export interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  images: string[]
  category_name: string | null
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 4) return 99
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[a.length][b.length]
}

function score(productName: string, rawQuery: string): number {
  const q    = normalize(rawQuery)
  const name = normalize(productName)

  if (name === q)            return 100
  if (name.startsWith(q))    return 90
  if (name.includes(q))      return 80

  const qWords    = q.split(/\s+/).filter((w) => w.length >= 2)
  const nameWords = name.split(/\s+/)

  let total = 0
  for (const qw of qWords) {
    let best = 0
    for (const nw of nameWords) {
      if (nw === qw)                               { best = Math.max(best, 30); break }
      if (nw.startsWith(qw) || qw.startsWith(nw)) { best = Math.max(best, 20) }
      const d = levenshtein(qw, nw)
      if (d === 1)  best = Math.max(best, 15)
      if (d === 2)  best = Math.max(best, 8)
    }
    total += best
  }
  return total
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function getPopularProducts(): Promise<SearchResult[]> {
  const supabase = await createClient()
  const toResult = (p: any): SearchResult => ({
    id: p.id, name: p.name, slug: p.slug,
    price: p.price, sale_price: p.sale_price,
    images: p.images ?? [],
    category_name: p.category?.name ?? null,
  })

  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, sale_price, images, category:categories(name)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(30)

  if (data?.length) return shuffle(data).slice(0, 10).map(toResult)

  const { data: fallback } = await supabase
    .from('products')
    .select('id, name, slug, price, sale_price, images, category:categories(name)')
    .eq('is_active', true)
    .limit(30)

  return shuffle(fallback ?? []).slice(0, 10).map(toResult)
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const normalized = normalize(q)
  const tokens     = normalized.split(/\s+/).filter((t) => t.length >= 2)

  const supabase = await createClient()

  // Build OR filter: match full query OR normalized OR any token
  const patterns = [
    `%${q}%`,
    `%${normalized}%`,
    ...tokens.map((t) => `%${t}%`),
  ]

  // Use .or() with ilike conditions
  const orFilter = patterns
    .map((p) => `name.ilike.${p}`)
    .join(',')

  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price, sale_price, images, category:categories(name)')
    .eq('is_active', true)
    .or(orFilter)
    .limit(30)

  if (!data?.length) return []

  // Score and sort client-side for relevance + typo tolerance
  type Row = { id: string; name: string; slug: string; price: number; sale_price: number | null; images: string[]; category: { name: string } | null }
  const scored = (data as unknown as Row[])
    .map((p) => ({ p, s: score(p.name, q) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)

  return scored.map(({ p }) => ({
    id:            p.id,
    name:          p.name,
    slug:          p.slug,
    price:         p.price,
    sale_price:    p.sale_price,
    images:        p.images ?? [],
    category_name: (p as any).category?.name ?? null,
  }))
}
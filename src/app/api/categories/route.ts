import { NextRequest } from 'next/server'
import { ok, corsOptions } from '@/lib/api/helpers'
import { getCategories, getTopLevelCategories } from '@/lib/repositories/categories'

export function OPTIONS() { return corsOptions() }

export async function GET(req: NextRequest) {
  const topOnly = req.nextUrl.searchParams.get('top') === 'true'
  const categories = topOnly ? await getTopLevelCategories() : await getCategories()
  return ok(categories)
}
import { NextRequest } from 'next/server'
import { ok, notFound, corsOptions } from '@/lib/api/helpers'
import { getProductBySlug } from '@/lib/repositories/products'

export function OPTIONS() { return corsOptions() }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return notFound('Ürün bulunamadı')
  return ok(product)
}
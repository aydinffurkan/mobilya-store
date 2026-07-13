'use server'

import { getProductsByIds as _getProductsByIds } from '@/lib/repositories/products'
import { Product } from '@/types'

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  return _getProductsByIds(ids)
}
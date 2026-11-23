import type { ProductComponent } from '@/types'

/** Parçanın görsel listesi. Eski tekil image_url verisine de geri düşer. */
export function getComponentImages(c: Pick<ProductComponent, 'images' | 'image_url'>): string[] {
  if (c.images && c.images.length > 0) return c.images
  return c.image_url ? [c.image_url] : []
}

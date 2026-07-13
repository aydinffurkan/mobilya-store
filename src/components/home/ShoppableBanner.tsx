import { getShoppableBanner, getSectionVisible } from '@/lib/repositories/settings'
import ShoppableBannerClient from './ShoppableBannerClient'

export default async function ShoppableBanner() {
  const [banner, visible] = await Promise.all([getShoppableBanner(), getSectionVisible('shoppable_banner')])
  if (!visible || !banner) return null
  return <ShoppableBannerClient banner={banner} />
}

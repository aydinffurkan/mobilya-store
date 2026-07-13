import { getTrustStats, getTrustBandVisible } from '@/lib/repositories/settings'
import { TrustIconName } from '@/types'
import {
  Award, Users, Package, Truck, Star, Shield, Heart, Home as HomeIcon, CheckCircle, Clock,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICON_MAP: Record<TrustIconName, React.ComponentType<LucideProps>> = {
  Award, Users, Package, Truck, Star, Shield, Heart, Home: HomeIcon, CheckCircle, Clock,
}

const DEFAULT_STATS = [
  { icon: 'Award' as TrustIconName, value: '20+', label: 'Yıllık Deneyim' },
  { icon: 'Users' as TrustIconName, value: '5.000+', label: 'Mutlu Müşteri' },
  { icon: 'Package' as TrustIconName, value: '500+', label: 'Ürün Çeşidi' },
  { icon: 'Truck' as TrustIconName, value: '81', label: 'Şehirde Teslimat' },
]

export default async function TrustBand() {
  const [stats, visible] = await Promise.all([getTrustStats(), getTrustBandVisible()])
  if (!visible) return null
  const items = stats.length > 0 ? stats : DEFAULT_STATS

  return (
    <section className="w-full bg-[#f5f0ea] border-y border-[#e8dfd3]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-[#ddd3c5]">
          {items.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon] ?? Award
            return (
              <div key={i} className="flex flex-col items-center text-center gap-2 sm:px-6">
                <Icon size={28} className="text-[#222222]" />
                <span className="text-2xl md:text-3xl font-bold text-[#222222] leading-none">
                  {stat.value}
                </span>
                <span className="text-[13px] text-[#888] font-light">{stat.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
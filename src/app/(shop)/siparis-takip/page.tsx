import { Metadata } from 'next'
import { Search } from 'lucide-react'
import OrderTracker from '@/components/tracking/OrderTracker'

export const metadata: Metadata = {
  title: 'Sipariş Takip',
  description: 'Siparişinizin güncel durumunu sorgulayın.',
}

export default function OrderTrackingPage() {
  return (
    <div className="min-h-[60vh] bg-[#f9f8f6] py-12 sm:py-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#222] items-center justify-center mb-4">
            <Search size={22} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sipariş Takip</h1>
          <p className="text-neutral-500 text-sm mt-2">
            Sipariş numaranız ve e-posta adresinizle siparişinizi sorgulayın.
          </p>
        </div>

        <OrderTracker />
      </div>
    </div>
  )
}

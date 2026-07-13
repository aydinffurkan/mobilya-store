import { Check, Clock, Package, Truck, CheckCircle2, XCircle, CreditCard, Landmark } from 'lucide-react'

const STEPS = [
  { key: 'pending',   label: 'Beklemede',     icon: Clock         },
  { key: 'confirmed', label: 'Onaylandı',     icon: Check         },
  { key: 'shipped',   label: 'Kargoda',       icon: Truck         },
  { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle2  },
]

// Ödeme bekleme durumları: timeline'ın başında pending olarak gösterilir
const PENDING_VARIANTS: Record<string, { color: string; bg: string; border: string; icon: typeof XCircle; title: string; desc: string }> = {
  pending_payment:  { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', icon: CreditCard,  title: 'Ödeme Bekleniyor',  desc: 'Müşteri ödemeyi henüz tamamlamadı.' },
  pending_transfer: { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100', icon: Landmark,    title: 'Havale Bekleniyor', desc: 'Havale/EFT alındıktan sonra onaylayın.' },
  payment_failed:   { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100',    icon: XCircle,     title: 'Ödeme Başarısız',   desc: 'Ödeme işlemi gerçekleşemedi.' },
}

const ORDER: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 }

export default function OrderTimeline({ status }: { status: string }) {
  const cancelled = status === 'cancelled'
  const pendingVariant = PENDING_VARIANTS[status]
  const currentIdx = ORDER[status] ?? 0

  if (cancelled) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl">
        <XCircle size={20} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Sipariş İptal Edildi</p>
          <p className="text-xs text-red-500">Bu sipariş iptal durumundadır.</p>
        </div>
      </div>
    )
  }

  if (pendingVariant) {
    const Icon = pendingVariant.icon
    return (
      <div className={`flex items-center gap-3 px-5 py-4 ${pendingVariant.bg} border ${pendingVariant.border} rounded-2xl`}>
        <Icon size={20} className={`${pendingVariant.color} flex-shrink-0`} />
        <div>
          <p className={`text-sm font-semibold ${pendingVariant.color}`}>{pendingVariant.title}</p>
          <p className={`text-xs ${pendingVariant.color} opacity-70`}>{pendingVariant.desc}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const pending = i > currentIdx
        const Icon    = step.icon

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${done ? 'bg-[#222222]' : 'bg-neutral-200'}`} />
            )}

            {/* Circle */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
              done   ? 'bg-[#222222] border-[#222222]' :
              active ? 'bg-white border-[#222222]'     :
                       'bg-white border-neutral-200'
            }`}>
              <Icon size={14} className={
                done   ? 'text-white'       :
                active ? 'text-[#222222]'  :
                         'text-neutral-300'
              } />
            </div>

            {/* Label */}
            <p className={`mt-2 text-[11px] font-medium text-center leading-tight ${
              done || active ? 'text-neutral-800' : 'text-neutral-400'
            }`}>
              {step.label}
            </p>
            {active && <span className="text-[10px] text-[#222222] font-semibold">şu an</span>}
          </div>
        )
      })}
    </div>
  )
}
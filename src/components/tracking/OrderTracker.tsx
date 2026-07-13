'use client'

import { useState } from 'react'
import { Search, Package, Truck, Check, Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { lookupOrder } from '@/lib/actions/tracking'
import type { TrackingOrder } from '@/lib/actions/tracking'

// ── Durum eşlemeleri ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:   'Beklemede',
  confirmed: 'Onaylandı',
  shipped:   'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
}
const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STEPS = [
  { key: 'pending',   label: 'Beklemede',     icon: Clock        },
  { key: 'confirmed', label: 'Onaylandı',     icon: Check        },
  { key: 'shipped',   label: 'Kargoda',       icon: Truck        },
  { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle2 },
]
const STEP_ORDER: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 }

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ status }: { status: string }) {
  if (status === 'cancelled') {
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

  const currentIdx = STEP_ORDER[status] ?? 0

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done   = i < currentIdx
        const active = i === currentIdx
        const Icon   = step.icon
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {i < STEPS.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${done ? 'bg-[#222]' : 'bg-neutral-200'}`} />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
              done   ? 'bg-[#222] border-[#222]' :
              active ? 'bg-white border-[#222]'  :
                       'bg-white border-neutral-200'
            }`}>
              <Icon size={14} className={done ? 'text-white' : active ? 'text-[#222]' : 'text-neutral-300'} />
            </div>
            <p className={`mt-2 text-[11px] font-medium text-center leading-tight ${done || active ? 'text-neutral-800' : 'text-neutral-400'}`}>
              {step.label}
            </p>
            {active && <span className="text-[10px] text-[#222] font-semibold">şu an</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Kargo takip linkleri ──────────────────────────────────────────────────────

const CARRIER_URLS: Record<string, (n: string) => string> = {
  'Yurtiçi Kargo':  (n) => `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${n}`,
  'Aras Kargo':     (n) => `https://www.araskargo.com.tr/tr/kargo-sorgula?barcode=${n}`,
  'MNG Kargo':      (n) => `https://www.mngkargo.com.tr/gonderi-sorgulama?documentNo=${n}`,
  'PTT Kargo':      (n) => `https://www.ptt.gov.tr/tr/anasayfa/gonder-sorgula?barkod=${n}`,
  'Sürat Kargo':    (n) => `https://www.suratkargo.com.tr/KargoSorgulama/Default.aspx?BarkodNo=${n}`,
  'UPS':            (n) => `https://www.ups.com/track?loc=tr_TR&tracknum=${n}`,
  'DHL':            (n) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${n}`,
}

function CargoLink({ carrier, trackingNo }: { carrier: string; trackingNo: string }) {
  const getUrl = CARRIER_URLS[carrier]
  const url = getUrl ? getUrl(trackingNo) : null

  return (
    <div className="flex items-start justify-between gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
      <div>
        <p className="text-xs font-semibold text-purple-700">{carrier}</p>
        <p className="font-mono text-sm font-bold text-[#222] mt-0.5">{trackingNo}</p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0 mt-0.5"
        >
          Kargo Takip <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}

// ── Sonuç kartı ───────────────────────────────────────────────────────────────

function OrderResult({ order }: { order: TrackingOrder }) {
  return (
    <div className="space-y-5 mt-8">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500 font-mono">Sipariş #{order.shortId}</p>
          <p className="text-sm text-neutral-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[order.status] ?? ''}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-border rounded-2xl px-5 py-5">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Sipariş Durumu</p>
        <Timeline status={order.status} />
      </div>

      {/* Kargo bilgisi */}
      {order.carrier && order.tracking_number && (
        <div className="bg-white border border-border rounded-2xl px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Kargo Bilgisi</p>
          <CargoLink carrier={order.carrier} trackingNo={order.tracking_number} />
        </div>
      )}

      {/* Ürünler */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Package size={14} className="text-neutral-400" />
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sipariş İçeriği</p>
        </div>
        <div className="divide-y divide-border">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-border">
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-muted" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-1">{item.product?.name ?? 'Ürün'}</p>
                {item.variant_name && <p className="text-xs text-neutral-400">{item.variant_name}</p>}
                <p className="text-xs text-neutral-400">{item.quantity} adet × {item.unit_price.toLocaleString('tr-TR')} ₺</p>
              </div>
              <p className="text-sm font-semibold flex-shrink-0">
                {(item.quantity * item.unit_price).toLocaleString('tr-TR')} ₺
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center px-5 py-3.5 bg-neutral-50 border-t border-border">
          <span className="text-sm text-neutral-500 font-medium">Toplam</span>
          <span className="font-bold text-[#222]">{order.total.toLocaleString('tr-TR')} ₺</span>
        </div>
      </div>
    </div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export default function OrderTracker() {
  const [orderNo, setOrderNo] = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [result, setResult]   = useState<TrackingOrder | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNo.trim() || !email.trim()) return
    setLoading(true)
    setSearched(false)
    setResult(null)
    try {
      const order = await lookupOrder(orderNo, email)
      setResult(order)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <div>
      {/* Arama formu */}
      <form onSubmit={handleSearch} className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sipariş Numarası</label>
          <input
            type="text"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="Örn: A1B2C3D4 veya tam sipariş ID'si"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#222] font-mono"
            autoComplete="off"
          />
          <p className="text-[11px] text-neutral-400">Sipariş onay e-postanızdaki # ile başlayan kodun ilk 8 hanesi</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">E-posta Adresi</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="siparis@email.com"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#222]"
          />
          <p className="text-[11px] text-neutral-400">Sipariş verirken kullandığınız e-posta adresi</p>
        </div>

        <button
          type="submit"
          disabled={loading || !orderNo.trim() || !email.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[#222] text-white font-medium py-2.5 rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40 text-sm"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Aranıyor...</>
            : <><Search size={15} /> Siparişimi Sorgula</>}
        </button>
      </form>

      {/* Sonuç */}
      {searched && !result && (
        <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-5 text-center">
          <XCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-700">Sipariş bulunamadı</p>
          <p className="text-xs text-red-500 mt-1">Sipariş numarası veya e-posta adresi hatalı olabilir.</p>
        </div>
      )}

      {result && <OrderResult order={result} />}
    </div>
  )
}

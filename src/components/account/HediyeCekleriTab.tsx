'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, Check, Loader2, AlertCircle, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { getMyVouchers, type Voucher } from '@/lib/actions/points'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  active:  'Kullanılabilir',
  used:    'Kullanıldı',
  expired: 'Süresi Doldu',
}

const STATUS_COLOR: Record<string, string> = {
  active:  'bg-green-100 text-green-700',
  used:    'bg-neutral-100 text-neutral-500',
  expired: 'bg-red-100 text-red-600',
}

export default function HediyeCekleriTab() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading]   = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    getMyVouchers()
      .then(setVouchers)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const copyCode = (id: string, code: string) => {
    void navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Kod kopyalandı')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (vouchers.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-12 text-center">
        <Gift size={40} className="text-muted-foreground/25 mx-auto mb-3" />
        <p className="font-medium text-neutral-800 mb-1">Henüz hediye çekiniz yok</p>
        <p className="text-sm text-muted-foreground mb-4">
          Puanlarınızı hediye çekine dönüştürerek alışverişlerinizde kullanabilirsiniz.
        </p>
        <Link
          href="?tab=puan"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#222222] text-white text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
        >
          <Tag size={14} />
          Puanlarıma Git
        </Link>
      </div>
    )
  }

  const active  = vouchers.filter((v) => v.status === 'active')
  const other   = vouchers.filter((v) => v.status !== 'active')

  return (
    <div className="space-y-5">

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kullanılabilir Çekler</p>
          {active.map((v) => (
            <VoucherCard key={v.id} v={v} copiedId={copiedId} onCopy={copyCode} />
          ))}
        </div>
      )}

      {other.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geçmiş Çekler</p>
          {other.map((v) => (
            <VoucherCard key={v.id} v={v} copiedId={copiedId} onCopy={copyCode} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
        <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Hediye çeklerinizi ödeme sayfasında "Hediye Çeki" alanına kodu girerek kullanabilirsiniz.
          Her çek yalnızca bir kez kullanılabilir.
        </p>
      </div>
    </div>
  )
}

function VoucherCard({
  v, copiedId, onCopy,
}: {
  v: Voucher
  copiedId: string | null
  onCopy: (id: string, code: string) => void
}) {
  const copied = copiedId === v.id

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${
      v.status === 'active' ? 'border-green-200' : 'border-border opacity-70'
    }`}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          v.status === 'active' ? 'bg-green-50' : 'bg-neutral-100'
        }`}>
          <Gift size={22} className={v.status === 'active' ? 'text-green-600' : 'text-neutral-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-[#222222]">
              {Number(v.amount).toLocaleString('tr-TR')} ₺
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLOR[v.status]}`}>
              {STATUS_LABEL[v.status]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {v.points_used.toLocaleString('tr-TR')} puan ile oluşturuldu
            {v.status === 'active' && (
              <> · Son kullanım: {new Date(v.expires_at).toLocaleDateString('tr-TR')}</>
            )}
            {v.status === 'used' && v.used_at && (
              <> · Kullanıldı: {new Date(v.used_at).toLocaleDateString('tr-TR')}</>
            )}
          </p>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-3 px-5 py-3 border-t ${
        v.status === 'active' ? 'border-green-100 bg-green-50/50' : 'border-border bg-neutral-50/50'
      }`}>
        <p className="font-mono text-base font-bold tracking-widest text-neutral-800">{v.code}</p>
        {v.status === 'active' && (
          <button
            type="button"
            onClick={() => onCopy(v.id, v.code)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222222] text-white text-xs font-medium rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        )}
      </div>
    </div>
  )
}

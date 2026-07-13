'use client'

import { useEffect, useState } from 'react'
import { Coins, TrendingDown, TrendingUp, Gift, Loader2, AlertCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { getMyPoints, convertPointsToVoucher, type PointsSummary } from '@/lib/actions/points'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const REASON_LABEL: Record<string, string> = {
  signup:    'Üye Olma Bonusu',
  review:    'Ürün Yorumu',
  order:     'Sipariş MessaPuanı',
  manual:    'Yönetici Ekledi',
  converted: 'Hediye Çeki Dönüşümü',
}

function formatExpiry(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PuanlarimTab() {
  const [summary, setSummary]   = useState<PointsSummary | null>(null)
  const [loading, setLoading]   = useState(true)
  const [converting, setConverting] = useState(false)
  const [convertInput, setConvertInput] = useState('')
  const [copied, setCopied]     = useState(false)
  const [lastVoucher, setLastVoucher] = useState<{ code: string; amount: number } | null>(null)

  const load = () => {
    setLoading(true)
    getMyPoints()
      .then(setSummary)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const minConvert = summary?.config.min_convert ?? 500
  const pointsPerTl = summary?.config.points_per_tl ?? 100

  const parsedPoints = parseInt(convertInput, 10)
  const isValidAmount =
    !isNaN(parsedPoints) &&
    parsedPoints >= minConvert &&
    parsedPoints % minConvert === 0 &&
    parsedPoints <= (summary?.balance ?? 0)

  const equivalentTl = isValidAmount ? parsedPoints / pointsPerTl : null

  const handleConvert = async () => {
    if (!isValidAmount) return
    setConverting(true)
    try {
      const result = await convertPointsToVoucher(parsedPoints)
      setLastVoucher(result)
      setConvertInput('')
      toast.success(`${parsedPoints} puan → ${result.amount.toLocaleString('tr-TR')} ₺ hediye çeki oluşturuldu!`)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setConverting(false)
    }
  }

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white border border-border rounded-2xl p-10 text-center">
        <AlertCircle size={36} className="text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Puan bilgisi yüklenemedi.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Bakiye kartı */}
      <div className="bg-[#222222] text-white rounded-2xl px-6 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Coins size={28} className="text-yellow-300" />
        </div>
        <div>
          <p className="text-sm text-white/60 mb-0.5">Kullanılabilir MessaPuan</p>
          <p className="text-4xl font-bold tracking-tight">{summary.balance.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-white/50 mt-1">
            {(summary.balance / pointsPerTl).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺ değerinde
          </p>
        </div>
      </div>

      {/* Son hediye çeki oluşturulduysa göster */}
      {lastVoucher && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-green-800">Hediye çekiniz oluşturuldu!</p>
            <p className="font-mono text-lg font-bold text-green-700 mt-0.5">{lastVoucher.code}</p>
            <p className="text-xs text-green-600">{lastVoucher.amount.toLocaleString('tr-TR')} ₺ değerinde</p>
          </div>
          <button
            type="button"
            onClick={() => copyCode(lastVoucher.code)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-xl hover:bg-green-700 transition-colors flex-shrink-0"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      )}

      {/* Dönüştürme paneli */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gift size={16} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm">Hediye Çekine Dönüştür</h3>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {minConvert.toLocaleString('tr-TR')} MessaPuan = {(minConvert / pointsPerTl).toLocaleString('tr-TR')} ₺ hediye çeki.
          Minimum {minConvert.toLocaleString('tr-TR')} MessaPuan ve katları ile dönüştürme yapabilirsiniz.
        </p>

        {summary.balance < minConvert ? (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Hediye çeki oluşturmak için en az{' '}
              <strong>{minConvert.toLocaleString('tr-TR')} MessaPuan</strong> gereklidir.
              {summary.balance > 0 && ` (Şu an: ${summary.balance.toLocaleString('tr-TR')} MessaPuan)`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Dönüştürülecek MessaPuan</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={convertInput}
                  onChange={(e) => setConvertInput(e.target.value)}
                  placeholder={`Ör. ${minConvert}`}
                  min={minConvert}
                  step={minConvert}
                  max={summary.balance}
                  className="max-w-[180px]"
                />
                {isValidAmount && equivalentTl !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-semibold text-green-700">= {equivalentTl.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
              </div>
              {convertInput && !isNaN(parsedPoints) && parsedPoints > 0 && !isValidAmount && (
                <p className="text-xs text-red-500">
                  {parsedPoints < minConvert
                    ? `Minimum ${minConvert.toLocaleString('tr-TR')} puan gerekli`
                    : parsedPoints > summary.balance
                    ? 'Yetersiz MessaPuan'
                    : `${minConvert.toLocaleString('tr-TR')}'nin katı olmalıdır`}
                </p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!isValidAmount || converting}
              onClick={() => void handleConvert()}
              className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
            >
              {converting
                ? <><Loader2 size={13} className="mr-1.5 animate-spin" />İşleniyor...</>
                : <><Gift size={13} className="mr-1.5" />Hediye Çeki Oluştur</>
              }
            </Button>
          </div>
        )}
      </div>

      {/* Hızlı dönüştürme butonları */}
      {summary.balance >= minConvert && (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 5, 10].map((mult) => {
            const pts = mult * minConvert
            if (pts > summary.balance) return null
            return (
              <button
                key={mult}
                type="button"
                onClick={() => setConvertInput(String(pts))}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:border-[#222222]/40 hover:bg-neutral-50 transition-colors font-medium"
              >
                {pts.toLocaleString('tr-TR')} MP → {(pts / pointsPerTl).toLocaleString('tr-TR')} ₺
              </button>
            )
          })}
        </div>
      )}

      {/* MessaPuan geçmişi */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">MessaPuan Geçmişi</h3>
        </div>

        {summary.history.length === 0 ? (
          <div className="py-10 text-center">
            <Coins size={32} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Henüz MessaPuan işleminiz yok.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {summary.history.map((row) => {
              const isPositive = row.points > 0
              return (
                <div key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPositive ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {isPositive
                      ? <TrendingUp size={14} className="text-green-600" />
                      : <TrendingDown size={14} className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">
                      {REASON_LABEL[row.reason] ?? row.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString('tr-TR')}
                      {row.expires_at && isPositive && (
                        <span> · Son kullanım: {formatExpiry(row.expires_at)}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{row.points.toLocaleString('tr-TR')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

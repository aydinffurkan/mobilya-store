'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, RotateCcw, ShoppingBag } from 'lucide-react'
import { savePointsConfig } from '@/app/admin/puanlar/actions'
import { DEFAULT_POINTS_CONFIG } from '@/lib/points'
import type { PointsConfig } from '@/lib/points'

interface Props {
  initialConfig: PointsConfig
}

const FIELDS: {
  key: keyof PointsConfig
  label: string
  description: string
  suffix: string
  min: number
  step: number
}[] = [
  {
    key: 'signup_points',
    label: 'Üye Olma MessaPuanı',
    description: 'Yeni kayıt olan her kullanıcıya bir kez verilir.',
    suffix: 'MessaPuan',
    min: 0,
    step: 10,
  },
  {
    key: 'review_points',
    label: 'Ürün Yorumu MessaPuanı',
    description: 'Her onaylanan yorum için kullanıcıya verilir.',
    suffix: 'MessaPuan',
    min: 0,
    step: 10,
  },
  {
    key: 'validity_days',
    label: 'MessaPuan Geçerlilik Süresi',
    description: 'Kazanılan MessaPuanlar bu süre sonunda sona erer.',
    suffix: 'gün',
    min: 1,
    step: 30,
  },
  {
    key: 'points_per_tl',
    label: 'Dönüşüm Oranı',
    description: 'Kaç MessaPuan = 1 ₺ hediye çeki.',
    suffix: 'MessaPuan / ₺',
    min: 1,
    step: 10,
  },
  {
    key: 'min_convert',
    label: 'Minimum Dönüşüm Miktarı',
    description: 'Hediye çekine dönüştürmek için gerekli minimum MessaPuan.',
    suffix: 'MessaPuan',
    min: 1,
    step: 100,
  },
  {
    key: 'voucher_validity_days',
    label: 'Hediye Çeki Geçerlilik Süresi',
    description: 'Oluşturulan hediye çeklerinin kullanım süresi.',
    suffix: 'gün',
    min: 1,
    step: 30,
  },
]

export default function PointsConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<PointsConfig>(initialConfig)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof PointsConfig, value: number) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const handleSave = async () => {
    if (config.order_tl_interval < 1) {
      toast.error('Sipariş aralığı en az 1 ₺ olmalı'); return
    }
    for (const field of FIELDS) {
      if (config[field.key] < field.min) {
        toast.error(`${field.label} ${field.min}'den küçük olamaz`); return
      }
    }
    setSaving(true)
    try {
      await savePointsConfig(config)
      toast.success('MessaPuan ayarları kaydedildi')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_POINTS_CONFIG)
    toast.info('Varsayılan değerlere döndürüldü (henüz kaydedilmedi)')
  }

  // Özet hesaplamalar
  const examplePoints = config.min_convert
  const exampleTl = config.points_per_tl > 0 ? examplePoints / config.points_per_tl : 0
  const orderExample = config.order_tl_interval > 0
    ? `${config.order_tl_interval} ₺ → ${config.order_points} MP`
    : '—'

  return (
    <div className="space-y-6">

      {/* Özet önizleme */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-amber-700">{config.signup_points}</p>
          <p className="text-xs text-amber-600 mt-0.5">Üye olma</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-blue-700">{config.review_points}</p>
          <p className="text-xs text-blue-600 mt-0.5">Yorum</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-center">
          <p className="text-sm font-bold text-purple-700 leading-tight">{orderExample}</p>
          <p className="text-xs text-purple-600 mt-0.5">Sipariş</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
          <p className="text-lg font-bold text-green-700">
            {examplePoints.toLocaleString('tr-TR')}P={exampleTl.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}₺
          </p>
          <p className="text-xs text-green-600 mt-0.5">Min. dönüşüm</p>
        </div>
      </div>

      {/* Sipariş MessaPuanı — özel çift alan */}
      <div className="border border-border rounded-xl p-4 bg-purple-50/40">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={14} className="text-purple-600" />
          <span className="text-sm font-medium text-foreground">Sipariş MessaPuanı</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Her X ₺ harcamada Y MessaPuan verilir. Örnek: 100 ₺ → 50 MP = 500 ₺ siparişte 250 MP.
        </p>
        <div className="flex items-center gap-2">
          {/* Sol — her kaç TL */}
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Her kaç ₺'ye</label>
            <div className="relative flex items-center">
              <input
                type="number"
                value={config.order_tl_interval}
                onChange={(e) => set('order_tl_interval', Math.max(1, Number(e.target.value)))}
                min={1}
                step={50}
                className="w-full px-3 py-2 pr-7 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-background"
              />
              <span className="absolute right-2.5 text-xs text-muted-foreground pointer-events-none">₺</span>
            </div>
          </div>

          {/* Ayraç */}
          <div className="flex flex-col items-center gap-0.5 pt-5 flex-shrink-0">
            <span className="text-lg font-bold text-muted-foreground">→</span>
          </div>

          {/* Sağ — kaç MessaPuan */}
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Kaç MessaPuan</label>
            <div className="relative flex items-center">
              <input
                type="number"
                value={config.order_points}
                onChange={(e) => set('order_points', Math.max(0, Number(e.target.value)))}
                min={0}
                step={5}
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40 bg-background"
              />
              <span className="absolute right-2.5 text-xs text-muted-foreground pointer-events-none leading-none whitespace-nowrap">MP</span>
            </div>
          </div>
        </div>

        {/* Örnek hesaplama */}
        {config.order_tl_interval > 0 && config.order_points > 0 && (
          <p className="mt-2 text-[11px] text-purple-700 bg-purple-100 rounded-lg px-3 py-1.5">
            Örnek: 1.000 ₺ sipariş →{' '}
            <strong>{Math.floor((1000 / config.order_tl_interval) * config.order_points).toLocaleString('tr-TR')} MessaPuan</strong>
          </p>
        )}
        {config.order_points === 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground italic">0 girilirse sipariş için MessaPuan verilmez.</p>
        )}
      </div>

      {/* Diğer ayar alanları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">{field.label}</label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{field.description}</p>
            <div className="relative flex items-center">
              <input
                type="number"
                value={config[field.key]}
                onChange={(e) => set(field.key, Math.max(field.min, Number(e.target.value)))}
                min={field.min}
                step={field.step}
                className="w-full px-3 py-2 pr-24 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/30 bg-background"
              />
              <span className="absolute right-3 text-xs text-muted-foreground whitespace-nowrap pointer-events-none">
                {field.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Butonlar */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-[#222222] text-white text-sm font-medium rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {saving
            ? <><Loader2 size={14} className="animate-spin" />Kaydediliyor...</>
            : <><Save size={14} />Ayarları Kaydet</>
          }
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium rounded-xl hover:bg-muted transition-colors"
        >
          <RotateCcw size={14} />
          Varsayılana Dön
        </button>
      </div>
    </div>
  )
}

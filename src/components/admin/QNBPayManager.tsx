'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, CreditCard } from 'lucide-react'
import { saveQNBPaySettings } from '@/app/admin/ayarlar/actions'

export interface QNBPaySettings {
  enabled: boolean
  test_mode: boolean
  app_id: string
  app_secret: string
  merchant_key: string
}

interface Props {
  initial: QNBPaySettings
}

export default function QNBPayManager({ initial }: Props) {
  const [settings, setSettings] = useState<QNBPaySettings>(initial)
  const [showSecret, setShowSecret] = useState(false)
  const [showMerchant, setShowMerchant] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (patch: Partial<QNBPaySettings>) => setSettings((s) => ({ ...s, ...patch }))

  const handleSave = async () => {
    if (!settings.app_id || !settings.app_secret || !settings.merchant_key) {
      toast.error('App ID, App Secret ve Merchant Key zorunlu')
      return
    }
    setSaving(true)
    try {
      await saveQNBPaySettings(settings)
      toast.success('QNBPay ayarları kaydedildi')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-border rounded-2xl p-5 bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
          <CreditCard size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 className="font-bold text-sm">QNBPay Entegrasyonu</h2>
          <p className="text-xs text-muted-foreground">Kredi kartı ödemelerini etkinleştir</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => set({ enabled: !settings.enabled })}
          className={`relative w-10 h-6 rounded-full transition-colors ${settings.enabled ? 'bg-green-500' : 'bg-muted'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-4' : ''}`} />
        </button>
        <span className="text-sm font-medium">{settings.enabled ? 'Aktif' : 'Pasif'}</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => set({ test_mode: !settings.test_mode })}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              settings.test_mode
                ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                : 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
            }`}
          >
            {settings.test_mode ? '🧪 Test Modu' : '✅ Canlı Mod'}
          </button>
        </div>
      </div>

      {settings.test_mode && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 text-xs text-orange-700 dark:text-orange-400">
          Test modunda gerçek ödeme alınmaz. Canlıya geçmeden önce test.qnbpay.com.tr üzerinden doğrulayın.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>App ID <span className="text-muted-foreground text-xs">(Uygulama Anahtarı)</span></Label>
          <Input
            value={settings.app_id}
            onChange={(e) => set({ app_id: e.target.value.trim() })}
            placeholder="QNBPay panelinden alın"
          />
        </div>

        <div className="space-y-1.5">
          <Label>App Secret <span className="text-muted-foreground text-xs">(Uygulama Parolası)</span></Label>
          <div className="relative">
            <Input
              type={showSecret ? 'text' : 'password'}
              value={settings.app_secret}
              onChange={(e) => set({ app_secret: e.target.value.trim() })}
              placeholder="••••••••"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowSecret((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label>Merchant Key <span className="text-muted-foreground text-xs">(Üye İşyeri Anahtarı)</span></Label>
          <div className="relative">
            <Input
              type={showMerchant ? 'text' : 'password'}
              value={settings.merchant_key}
              onChange={(e) => set({ merchant_key: e.target.value.trim() })}
              placeholder="••••••••"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowMerchant((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showMerchant ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Bu değerler QNBPay yönetim panelinizin Entegrasyon Ayarları bölümünde bulunur.
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  )
}

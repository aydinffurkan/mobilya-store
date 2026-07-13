'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Home } from 'lucide-react'
import { saveKapiOdeme, type KapiOdemeSettings } from '@/app/admin/odeme/actions'

export default function KapiOdemeManager({ initial }: { initial: KapiOdemeSettings }) {
  const [s, setS]       = useState<KapiOdemeSettings>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveKapiOdeme(s)
      toast.success('Kapıda ödeme ayarları kaydedildi')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-border rounded-2xl p-5 bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
          <Home size={18} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="font-bold text-sm">Kapıda Ödeme</h2>
          <p className="text-xs text-muted-foreground">Müşteri teslimatta nakit veya kartla öder</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={s.enabled}
          onClick={() => setS((p) => ({ ...p, enabled: !p.enabled }))}
          className={`ml-auto relative w-10 h-6 rounded-full transition-colors ${s.enabled ? 'bg-green-500' : 'bg-muted'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {s.enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Ek Ücret (₺) <span className="text-muted-foreground font-normal text-xs">0 = ücretsiz</span></Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={s.extra_fee}
              onChange={(e) => setS((p) => ({ ...p, extra_fee: Number(e.target.value) }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama <span className="text-muted-foreground font-normal text-xs">(checkout'ta gösterilir)</span></Label>
            <Input
              value={s.description}
              onChange={(e) => setS((p) => ({ ...p, description: e.target.value }))}
              placeholder="Kapıda nakit veya kredi kartı ile ödeme"
            />
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  )
}

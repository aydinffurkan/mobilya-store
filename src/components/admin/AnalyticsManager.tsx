'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveAnalyticsSettings } from '@/app/admin/ayarlar/actions'
import { AnalyticsSettings } from '@/lib/repositories/settings'

interface Props {
  initial: AnalyticsSettings
}

export default function AnalyticsManager({ initial }: Props) {
  const [data, setData] = useState<AnalyticsSettings>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAnalyticsSettings(data)
      toast.success('Analitik ayarları kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-5">
      <div>
        <h2 className="font-semibold">Analitik & İzleme</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          ID'ler girildiğinde ve ziyaretçi çerez onayı verdiğinde otomatik yüklenir. Boş bırakılırsa devre dışı kalır.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ga-id">Google Analytics 4 — Measurement ID</Label>
          <Input
            id="ga-id"
            value={data.ga_id}
            onChange={(e) => setData((d) => ({ ...d, ga_id: e.target.value }))}
            placeholder="G-XXXXXXXXXX"
            className="font-mono text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            GA4 → Yönetici → Veri Akışları → Ölçüm Kimliği
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
          <Input
            id="fb-pixel"
            value={data.fb_pixel_id}
            onChange={(e) => setData((d) => ({ ...d, fb_pixel_id: e.target.value }))}
            placeholder="1234567890123"
            className="font-mono text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Meta Business → Etkinlikler Yöneticisi → Pixel ID
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  )
}
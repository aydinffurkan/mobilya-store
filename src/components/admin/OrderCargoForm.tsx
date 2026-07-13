'use client'

import { useState } from 'react'
import { Loader2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { saveOrderCargoInfo } from '@/app/admin/siparisler/actions'

const CARRIERS = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'UPS', 'DHL', 'Özel Taşıma']

interface Props {
  orderId: string
  initialCarrier: string | null
  initialTracking: string | null
}

export default function OrderCargoForm({ orderId, initialCarrier, initialTracking }: Props) {
  const [carrier,  setCarrier]  = useState(initialCarrier  ?? '')
  const [tracking, setTracking] = useState(initialTracking ?? '')
  const [saving,   setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveOrderCargoInfo(orderId, { tracking_number: tracking, carrier })
      toast.success('Kargo bilgileri kaydedildi')
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Kargo Firması</Label>
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
        >
          <option value="">Seçin…</option>
          {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Takip Numarası</Label>
        <Input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="örn. 1234567890"
          className="h-9 text-sm font-mono"
        />
      </div>

      {tracking && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Müşteri bu numarayla kargosunu takip edebilir.
        </p>
      )}

      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
      >
        {saving
          ? <><Loader2 size={13} className="animate-spin mr-1.5" />Kaydediliyor…</>
          : <><Truck size={13} className="mr-1.5" />Kargo Bilgilerini Kaydet</>
        }
      </Button>
    </div>
  )
}
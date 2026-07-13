'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { saveFavicon } from '@/app/admin/ayarlar/actions'
import ImageUploader from '@/components/shared/ImageUploader'

interface Props {
  initial: string | null
}

export default function FaviconManager({ initial }: Props) {
  const [url, setUrl] = useState<string | null>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveFavicon(url)
      toast.success('Favicon kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Favicon</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tarayıcı sekmesinde görünen simge. PNG veya ICO formatı önerilir; en az 32×32px, ideal 512×512px kare görsel kullanın.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Favicon Görseli</Label>
        <ImageUploader
          value={url}
          onChange={setUrl}
          storagePrefix="favicon-"
          height={80}
          placeholder="Favicon Yükle (PNG/ICO, kare)"
        />
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

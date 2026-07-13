'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveSocialLinks, SocialLinks } from '@/app/admin/ayarlar/actions'

interface Props {
  initial: SocialLinks
}

const PLATFORMS = [
  { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/hesabiniz' },
  { key: 'facebook'  as const, label: 'Facebook',  placeholder: 'https://facebook.com/sayfaniz'  },
  { key: 'youtube'   as const, label: 'YouTube',   placeholder: 'https://youtube.com/@kanaliniz' },
  { key: 'tiktok'    as const, label: 'TikTok',    placeholder: 'https://tiktok.com/@hesabiniz'  },
]

export default function SocialLinksManager({ initial }: Props) {
  const [data, setData] = useState<SocialLinks>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSocialLinks(data)
      toast.success('Sosyal medya linkleri kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Sosyal Medya</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Footer'da gösterilecek sosyal medya linkleri. Boş bırakılan platformlar gösterilmez.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={data[key] ?? ''}
              onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
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

'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { saveSectionVisible } from '@/app/admin/ayarlar/actions'

interface Props {
  sectionKey: string
  initialVisible: boolean
}

export default function SectionVisibilityToggle({ sectionKey, initialVisible }: Props) {
  const [visible, setVisible] = useState(initialVisible)
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    const next = !visible
    try {
      await saveSectionVisible(sectionKey, next)
      setVisible(next)
      toast.success(next ? 'Bölüm artık görünür' : 'Bölüm gizlendi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setToggling(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={toggling}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
        visible
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
      } disabled:opacity-60`}
    >
      {visible ? <Eye size={13} /> : <EyeOff size={13} />}
      {toggling ? 'Kaydediliyor...' : visible ? 'Görünür' : 'Gizli'}
      <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${visible ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}

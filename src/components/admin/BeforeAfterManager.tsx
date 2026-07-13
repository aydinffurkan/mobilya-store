'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { saveBeforeAfter, uploadBeforeAfterImage } from '@/app/admin/ayarlar/actions'
import { ImagePlus, X } from 'lucide-react'

export interface BeforeAfterData {
  enabled: boolean
  title: string
  subtitle: string
  left_image: string
  right_image: string
  left_label: string
  right_label: string
}

interface Props {
  initial: BeforeAfterData
}

function ImageUploader({
  label,
  value,
  onChange,
  side,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  side: 'left' | 'right'
}) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('side', side)
      const url = await uploadBeforeAfterImage(fd)
      onChange(url)
      toast.success('Görsel yüklendi')
    } catch (err: unknown) {
      toast.error('Yükleme hatası: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-neutral-600">{label}</p>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '16/7' }}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="cursor-pointer bg-white text-[#222] text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80">
              Değiştir
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 flex items-center gap-1"
            >
              <X size={12} /> Kaldır
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-medium">
              Yükleniyor...
            </div>
          )}
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[#222]/40 transition-colors ${uploading ? 'opacity-50' : ''}`} style={{ aspectRatio: '16/7' }}>
          <ImagePlus size={22} className="text-neutral-400" />
          <span className="text-xs text-neutral-500 font-medium">{uploading ? 'Yükleniyor...' : 'Görsel Seç'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
    </div>
  )
}

export default function BeforeAfterManager({ initial }: Props) {
  const [data, setData] = useState<BeforeAfterData>(initial)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof BeforeAfterData, value: string | boolean) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!data.left_image || !data.right_image) {
      toast.error('Her iki görsel de zorunludur')
      return
    }
    setSaving(true)
    try {
      await saveBeforeAfter(data)
      toast.success('Karşılaştırma bölümü kaydedildi')
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Önce / Sonra Karşılaştırma</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kaydırılabilir çizgiyle iki görseli karşılaştıran tam genişlik bölüm
          </p>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => set('enabled', !data.enabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            data.enabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
          }`}
        >
          {data.enabled ? 'Görünür' : 'Gizli'}
          <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${data.enabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${data.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </span>
        </button>
      </div>

      {/* Başlık & alt başlık */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-700 block mb-1">Bölüm Başlığı (opsiyonel)</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Tasarım Farkını Keşfedin"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-[#222]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-700 block mb-1">Alt Başlık (opsiyonel)</label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="Çizgiyi sürükleyerek farkı görün"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-[#222]"
          />
        </div>
      </div>

      {/* Görseller */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <ImageUploader
            label="Sol Görsel (Önce)"
            value={data.left_image}
            onChange={(url) => set('left_image', url)}
            side="left"
          />
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">Sol Etiket</label>
            <input
              type="text"
              value={data.left_label}
              onChange={(e) => set('left_label', e.target.value)}
              placeholder="Klasik Tasarım"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-[#222]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <ImageUploader
            label="Sağ Görsel (Sonra)"
            value={data.right_image}
            onChange={(url) => set('right_image', url)}
            side="right"
          />
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">Sağ Etiket</label>
            <input
              type="text"
              value={data.right_label}
              onChange={(e) => set('right_label', e.target.value)}
              placeholder="Modern Tasarım"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-[#222]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#222] text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:opacity-80 transition-opacity"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

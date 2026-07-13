'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { savePromoBanner, uploadPromoBannerImage } from '@/app/admin/ayarlar/actions'
import type { PromoBannerData } from '@/components/home/PromoBanner'

interface Props {
  slot: string
  label: string
  initial: PromoBannerData
}

export default function PromoBannerManager({ slot, label, initial }: Props) {
  const [enabled,         setEnabled]         = useState(initial.enabled)
  const [imageUrl,        setImageUrl]        = useState(initial.image_url ?? '')
  const [mobileImageUrl,  setMobileImageUrl]  = useState(initial.mobile_image_url ?? '')
  const [href,            setHref]            = useState(initial.href || '/')
  const [alt,             setAlt]             = useState(initial.alt || '')
  const [uploading,       setUploading]       = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [saving,          setSaving]          = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isMobile) setUploadingMobile(true); else setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('slot', isMobile ? `${slot}-mobile` : slot)
      const url = await uploadPromoBannerImage(fd)
      if (isMobile) setMobileImageUrl(url); else setImageUrl(url)
      toast.success('Görsel yüklendi')
    } catch (err: any) {
      toast.error(err.message ?? 'Yüklenemedi')
    } finally {
      if (isMobile) setUploadingMobile(false); else setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePromoBanner(slot, { enabled, image_url: imageUrl || null, mobile_image_url: mobileImageUrl || null, href, alt })
      toast.success('Banner kaydedildi')
    } catch (err: any) {
      toast.error(err.message ?? 'Hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tam genişlik promo banner</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setEnabled(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-[#222222]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-xs text-muted-foreground">{enabled ? 'Aktif' : 'Gizli'}</span>
        </label>
      </div>

      {/* Masaüstü görseli */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Masaüstü Görseli <span className="text-[11px] opacity-60">(önerilen: 1440×200px)</span></p>
        {imageUrl ? (
          <div className="relative w-full rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '7/1' }}>
            <Image src={imageUrl} alt="Banner" fill className="object-cover" />
            <button type="button" onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow">
              <X size={13} />
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-secondary/20 transition-colors py-6 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, false)} />
            {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <ImagePlus size={20} className="text-muted-foreground" />}
            <span className="text-sm text-muted-foreground mt-2">{uploading ? 'Yükleniyor...' : 'Masaüstü banner yükle'}</span>
          </label>
        )}
      </div>

      {/* Mobil görseli */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Mobil Görseli <span className="text-[11px] opacity-60">(önerilen: 750×250px — yüklenmezse masaüstü kırpılır)</span></p>
        {mobileImageUrl ? (
          <div className="relative w-full rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '3/1' }}>
            <Image src={mobileImageUrl} alt="Mobil banner" fill className="object-cover" />
            <button type="button" onClick={() => setMobileImageUrl('')}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow">
              <X size={13} />
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-secondary/20 transition-colors py-5 ${uploadingMobile ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, true)} />
            {uploadingMobile ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <ImagePlus size={20} className="text-muted-foreground" />}
            <span className="text-sm text-muted-foreground mt-2">{uploadingMobile ? 'Yükleniyor...' : 'Mobil banner yükle (isteğe bağlı)'}</span>
          </label>
        )}
      </div>

      {/* Link + Alt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tıklanınca gidilecek URL</label>
          <input
            value={href}
            onChange={e => setHref(e.target.value)}
            placeholder="/urunler"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Alt metin (SEO)</label>
          <input
            value={alt}
            onChange={e => setAlt(e.target.value)}
            placeholder="Kampanya açıklaması"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>
      </div>

      <div className="pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-[#222222] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, RotateCcw, RotateCw, RefreshCw, Check } from 'lucide-react'
import type { ImageAdjustments } from '@/lib/utils/imageProcessing'

interface Props {
  src: string
  onSave: (blob: Blob) => void
  onCancel: () => void
  initialAspect?: number
}

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: 'Serbest', value: undefined },
  { label: '1:1',     value: 1 },
  { label: '4:3',     value: 4 / 3 },
  { label: '3:4',     value: 3 / 4 },
  { label: '16:9',    value: 16 / 9 },
]

// ─── Görüntü dışa aktarma ────────────────────────────────────────────────────

async function exportCrop(
  rotatedSrc: string,
  pixelCrop: PixelCrop,
  displayW: number,
  displayH: number,
  adj: ImageAdjustments
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Görüntüleme boyutundan doğal piksel boyutuna ölçekle
      const scaleX = img.naturalWidth  / displayW
      const scaleY = img.naturalHeight / displayH
      const x = pixelCrop.x * scaleX
      const y = pixelCrop.y * scaleY
      const w = pixelCrop.width  * scaleX
      const h = pixelCrop.height * scaleY

      const out = document.createElement('canvas')
      out.width  = Math.round(w)
      out.height = Math.round(h)
      const ctx = out.getContext('2d')!
      ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`
      ctx.drawImage(img, x, y, w, h, 0, 0, out.width, out.height)
      out.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = rotatedSrc
  })
}

// ─── Döndürme: src → döndürülmüş data URL ────────────────────────────────────

function renderRotated(src: string, deg: number): Promise<string> {
  if (deg === 0) return Promise.resolve(src)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const rad  = (deg * Math.PI) / 180
      const cosA = Math.abs(Math.cos(rad))
      const sinA = Math.abs(Math.sin(rad))
      const bw   = cosA * img.naturalWidth  + sinA * img.naturalHeight
      const bh   = sinA * img.naturalWidth  + cosA * img.naturalHeight
      const c = document.createElement('canvas')
      c.width  = Math.round(bw)
      c.height = Math.round(bh)
      const ctx = c.getContext('2d')!
      ctx.translate(bw / 2, bh / 2)
      ctx.rotate(rad)
      ctx.translate(-img.naturalWidth / 2, -img.naturalHeight / 2)
      ctx.drawImage(img, 0, 0)
      resolve(c.toDataURL('image/jpeg', 0.95))
    }
    img.onerror = reject
    img.src = src
  })
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────

export default function ImageEditor({ src, onSave, onCancel, initialAspect }: Props) {
  const [crop,        setCrop]       = useState<Crop>()
  const [completed,   setCompleted]  = useState<PixelCrop>()
  const [aspect,      setAspect]     = useState<number | undefined>(initialAspect)
  const [rotation,    setRotation]   = useState(0)
  const [rotatedSrc,  setRotatedSrc] = useState(src)
  const [adj,         setAdj]        = useState<ImageAdjustments>({ brightness: 100, contrast: 100, saturation: 100 })
  const [processing,  setProcessing] = useState(false)
  const [rotating,    setRotating]   = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Döndürme değişince yeni görüntü oluştur, kırpmayı sıfırla
  useEffect(() => {
    setRotating(true)
    renderRotated(src, rotation)
      .then((url) => {
        setRotatedSrc(url)
        setCrop(undefined)
        setCompleted(undefined)
      })
      .finally(() => setRotating(false))
  }, [src, rotation])

  // Görüntü yüklenince ilk kırpma alanını ayarla
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    if (aspect) {
      setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h))
    } else {
      // Serbest: başlangıçta tam görsel seçili
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
    }
  }, [aspect])

  const changeAspect = (value: number | undefined) => {
    setAspect(value)
    if (!imgRef.current) return
    const { naturalWidth: w, naturalHeight: h } = imgRef.current
    if (value) {
      setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, value, w, h), w, h))
    } else {
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
    }
    setCompleted(undefined)
  }

  const handleApply = async () => {
    const el = imgRef.current
    if (!el) return
    const cropData = completed ?? (el ? {
      unit: 'px' as const,
      x: 0, y: 0,
      width: el.width,
      height: el.height,
    } : null)
    if (!cropData) return

    setProcessing(true)
    try {
      const blob = await exportCrop(rotatedSrc, cropData as PixelCrop, el.width, el.height, adj)
      onSave(blob)
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setAdj({ brightness: 100, contrast: 100, saturation: 100 })
    setRotation(0)
    changeAspect(initialAspect)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col lg:flex-row">

      {/* Kırpma alanı */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center overflow-auto p-4"
        style={{ filter: `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)` }}
      >
        {rotating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompleted(c)}
          aspect={aspect}
          keepSelection
          ruleOfThirds
          className="max-h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={rotatedSrc}
            alt="Düzenle"
            onLoad={onImageLoad}
            style={{ maxHeight: '75vh', maxWidth: '100%', display: 'block' }}
          />
        </ReactCrop>
      </div>

      {/* Kontrol paneli */}
      <div className="w-full lg:w-72 bg-[#222222] flex flex-col flex-shrink-0 max-h-[48vh] lg:max-h-none lg:h-full">

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
          <h3 className="text-white font-medium text-sm tracking-wide">Resim Düzenle</h3>
          <button onClick={onCancel} className="text-white/50 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

          {/* En-Boy Oranı */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">En-Boy Oranı</p>
            <div className="grid grid-cols-5 gap-1">
              {ASPECTS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => changeAspect(opt.value)}
                  className={`py-1 rounded-lg text-[11px] font-medium transition-colors text-center ${
                    aspect === opt.value
                      ? 'bg-[#222222] text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/30 leading-relaxed">
              Serbest modda köşe/kenar tutamaçlarını sürükleyerek istediğiniz alanı seçin.
            </p>
          </div>

          {/* Döndür */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Döndür</p>
              <span className="text-xs text-white/30">{rotation}°</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => Math.max(-180, r - 90))}
                className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0"
              >
                <RotateCcw size={13} />
              </button>
              <input
                type="range" min={-180} max={180} step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-[#222222]"
              />
              <button
                type="button"
                onClick={() => setRotation((r) => Math.min(180, r + 90))}
                className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0"
              >
                <RotateCw size={13} />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <AdjSlider label="Parlaklık" display={`${adj.brightness}%`}
            value={adj.brightness} min={50} max={150} step={1}
            onChange={(v) => setAdj((a) => ({ ...a, brightness: v }))} />
          <AdjSlider label="Kontrast" display={`${adj.contrast}%`}
            value={adj.contrast} min={50} max={150} step={1}
            onChange={(v) => setAdj((a) => ({ ...a, contrast: v }))} />
          <AdjSlider label="Doygunluk" display={`${adj.saturation}%`}
            value={adj.saturation} min={0} max={200} step={1}
            onChange={(v) => setAdj((a) => ({ ...a, saturation: v }))} />

          <button
            type="button" onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl bg-white/10 text-white/50 hover:bg-white/20 hover:text-white text-xs transition-colors"
          >
            <RefreshCw size={12} /> Sıfırla
          </button>
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/20 hover:text-white transition-colors">
            İptal
          </button>
          <button type="button" onClick={handleApply} disabled={processing || rotating}
            className="flex-1 py-2 rounded-xl bg-[#222222] text-white text-sm font-medium hover:bg-[#222222] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
            {processing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              <><Check size={14} /> Uygula</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdjSlider({ label, display, value, min, max, step, onChange }: {
  label: string; display: string; value: number
  min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">{label}</p>
        <span className="text-xs text-white/30">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#222222]" />
    </div>
  )
}

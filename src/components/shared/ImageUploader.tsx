'use client'

import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Pencil, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ImageEditor from './ImageEditor'
import { fetchAsObjectUrl } from '@/lib/utils/imageProcessing'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  storagePrefix?: string
  aspectRatio?: number
  height?: number
  placeholder?: string
}

export default function ImageUploader({
  value,
  onChange,
  storagePrefix = 'img-',
  aspectRatio,
  height = 200,
  placeholder = 'Görsel Yükle',
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadBlob = async (blob: Blob): Promise<string> => {
    const supabase = createClient()
    const ext = blob.type === 'image/png' ? 'png' : 'jpg'
    const path = `${storagePrefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const file = new File([blob], path, { type: blob.type })
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) throw new Error(error.message)
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const deleteOld = async (url: string) => {
    try {
      const supabase = createClient()
      const path = url.split('/product-images/')[1]?.split('?')[0]
      if (path) await supabase.storage.from('product-images').remove([path])
    } catch {
      // storage delete errors are non-fatal
    }
  }

  const handleEditorSave = async (blob: Blob) => {
    setEditorSrc(null)
    setUploading(true)
    try {
      if (value) await deleteOld(value)
      const url = await uploadBlob(blob)
      onChange(url)
    } catch (e: unknown) {
      toast.error('Yüklenemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setUploading(false)
    }
  }

  const openWithFile = (file: File) => {
    setEditorSrc(URL.createObjectURL(file))
  }

  const openExisting = async () => {
    if (!value) return
    try {
      const objectUrl = await fetchAsObjectUrl(value)
      setEditorSrc(objectUrl)
    } catch {
      setEditorSrc(value)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) openWithFile(file)
  }, [])

  const handleRemove = async () => {
    if (!value) return
    await deleteOld(value)
    onChange(null)
  }

  return (
    <>
      {value ? (
        <div
          className="relative w-full rounded-xl overflow-hidden border border-border group"
          style={{ height }}
        >
          <Image
            src={value}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={openExisting}
              disabled={uploading}
              title="Düzenle / Kırp"
              className="bg-white rounded-full p-2.5 shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Pencil size={15} className="text-[#222222]" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              title="Kaldır"
              className="bg-white rounded-full p-2.5 shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Trash2 size={15} className="text-red-500" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 size={26} className="text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            dragging
              ? 'border-[#222222] bg-[#faf7f2] text-[#222222] scale-[1.01]'
              : 'border-border text-muted-foreground hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222]'
          }`}
          style={{ height }}
        >
          {uploading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <>
              <ImagePlus size={26} />
              <span className="text-sm font-medium">{placeholder}</span>
              <span className="text-[11px] opacity-60">veya buraya sürükle</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) openWithFile(f)
          e.target.value = ''
        }}
      />

      {editorSrc && (
        <ImageEditor
          src={editorSrc}
          onSave={handleEditorSave}
          onCancel={() => setEditorSrc(null)}
          initialAspect={aspectRatio}
        />
      )}
    </>
  )
}
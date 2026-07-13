'use client'

import { useState } from 'react'
import { KeyRound, Eye, EyeOff, Check } from 'lucide-react'
import { toast } from 'sonner'
import { saveAnthropicApiKey } from '@/app/admin/ayarlar/actions'

interface Props {
  maskedKey: string | null
}

export default function AnthropicApiKeyManager({ maskedKey }: Props) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!value.trim()) return
    setSaving(true)
    try {
      await saveAnthropicApiKey(value.trim())
      setSaved(true)
      setValue('')
      toast.success('API anahtarı kaydedildi')
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#222] flex items-center justify-center flex-shrink-0 mt-0.5">
          <KeyRound size={15} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold">Anthropic API Anahtarı</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Yapay zeka sohbet asistanı için gerekli. Anahtar şifrelenmiş olarak veritabanında saklanır.
          </p>
        </div>
      </div>

      {maskedKey && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <Check size={13} className="flex-shrink-0" />
          <span>Kayıtlı anahtar: <code className="font-mono">{maskedKey}</code></span>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={maskedKey ? 'Yeni anahtar girerek değiştirin' : 'sk-ant-api03-...'}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 pr-10 outline-none focus:border-[#222] font-mono"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            tabIndex={-1}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!value.trim() || saving}
          className="px-4 py-2 bg-[#222] text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi ✓' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

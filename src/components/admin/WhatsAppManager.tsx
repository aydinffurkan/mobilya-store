'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { saveWhatsAppSettings } from '@/app/admin/ayarlar/actions'

export interface WhatsAppSettings {
  enabled: boolean
  phone: string
  message: string
}

interface Props {
  initial: WhatsAppSettings
}

export default function WhatsAppManager({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [phone, setPhone] = useState(initial.phone)
  const [message, setMessage] = useState(initial.message)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!phone.trim()) { toast.error('Telefon numarası gerekli'); return }
    setSaving(true)
    try {
      await saveWhatsAppSettings({ enabled, phone: phone.trim(), message: message.trim() })
      toast.success('WhatsApp ayarları kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#25D366' }}>
            <svg viewBox="0 0 32 32" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.347.632 4.64 1.832 6.64L2.667 29.333l6.88-1.8A13.253 13.253 0 0 0 16.004 29.333c7.36 0 13.33-5.973 13.33-13.333 0-7.36-5.97-13.333-13.33-13.333Zm0 24c-2.12 0-4.2-.573-6.027-1.653l-.427-.253-4.08 1.067 1.093-3.973-.28-.44A10.627 10.627 0 0 1 5.333 16c0-5.88 4.787-10.667 10.667-10.667S26.667 10.12 26.667 16 21.88 26.667 16.004 26.667Zm5.853-7.987c-.32-.16-1.893-.933-2.187-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-.96 1.253-.133.213-.267.24-.587.08-.32-.16-1.347-.493-2.56-1.573-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.147-.14.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.627-.52-.54-.72-.547h-.613c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.253 3.44 5.453 4.827.76.327 1.353.52 1.817.667.763.24 1.46.207 2.013.127.613-.093 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373Z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold">WhatsApp Butonu</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sol alt köşede yeşil WhatsApp butonu gösterilir</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            enabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
          }`}
        >
          {enabled ? 'Görünür' : 'Gizli'}
          <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </span>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-neutral-700 block mb-1">
            Telefon Numarası <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="905551234567 (başında + olmadan, ülke kodu dahil)"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-[#222] font-mono"
          />
          <p className="text-[11px] text-neutral-400 mt-1">Örnek: 905551234567 (Türkiye için 90 ile başlayın)</p>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-700 block mb-1">Ön Mesaj (opsiyonel)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Merhaba, ürünleriniz hakkında bilgi almak istiyorum."
            className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-[#222]"
          />
          <p className="text-[11px] text-neutral-400 mt-1">Müşteri WhatsApp'ı açtığında bu metin hazır gelir</p>
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

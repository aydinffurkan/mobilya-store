'use client'

import { useState } from 'react'
import { StickyNote, Save, Loader2, Check, Tag, X } from 'lucide-react'
import { saveCustomerNote, saveCustomerTag } from '@/app/admin/musteriler/actions'

const TAGS = [
  { value: 'vip',     label: 'VIP',      cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'aktif',   label: 'Aktif',    cls: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'inaktif', label: 'İnaktif',  cls: 'bg-gray-100 text-gray-500 border-gray-200'   },
  { value: 'riskli',  label: 'Riskli',   cls: 'bg-red-100 text-red-600 border-red-200'       },
] as const

interface Props {
  customerId: string
  initialNote?: string | null
  initialTag?: string | null
}

export default function CustomerNoteForm({ customerId, initialNote, initialTag }: Props) {
  const [note, setNote]           = useState(initialNote ?? '')
  const [tag, setTag]             = useState<string | null>(initialTag ?? null)
  const [savingNote, setSavingNote] = useState(false)
  const [savingTag, setSavingTag]   = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)

  const handleSaveNote = async () => {
    setSavingNote(true)
    setNoteSaved(false)
    try {
      await saveCustomerNote(customerId, note)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingNote(false)
    }
  }

  const handleTagChange = async (newTag: string | null) => {
    const next = tag === newTag ? null : newTag
    setTag(next)
    setSavingTag(true)
    try {
      await saveCustomerTag(customerId, next)
    } catch (e) {
      console.error(e)
      setTag(tag)
    } finally {
      setSavingTag(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Tag */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-purple-500" />
          <h2 className="font-semibold text-sm">Etiket</h2>
          {savingTag && <Loader2 size={12} className="animate-spin text-muted-foreground ml-auto" />}
        </div>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTagChange(t.value)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                tag === t.value
                  ? t.cls + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-secondary text-muted-foreground border-border hover:border-current'
              }`}
            >
              {tag === t.value && <X size={10} className="inline mr-1 -mt-px" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote size={14} className="text-amber-500" />
          <h2 className="font-semibold text-sm">Admin Notu</h2>
        </div>
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setNoteSaved(false) }}
          placeholder="Bu müşteri hakkında dahili not ekleyin..."
          rows={4}
          className="w-full text-sm resize-none rounded-xl border border-border bg-secondary/30 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#222222]/20 focus:border-[#222222]/40 transition-all"
        />
        <button
          onClick={handleSaveNote}
          disabled={savingNote}
          className={`mt-2.5 w-full flex items-center justify-center gap-2 rounded-xl text-sm font-medium py-2 transition-colors disabled:opacity-60 ${
            noteSaved
              ? 'bg-green-600 text-white'
              : 'bg-[#222222] text-white hover:bg-[#7a5c10]'
          }`}
        >
          {savingNote ? (
            <Loader2 size={14} className="animate-spin" />
          ) : noteSaved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {noteSaved ? 'Kaydedildi!' : 'Notu Kaydet'}
        </button>
      </div>

    </div>
  )
}
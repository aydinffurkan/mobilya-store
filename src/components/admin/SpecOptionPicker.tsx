'use client'

import { useState } from 'react'
import { Check, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addSpecOption } from '@/app/admin/urunler/actions'
import { joinSpecValue, sanitizeOptionValue, splitSpecValue } from '@/lib/productSpecs'
import type { SpecOption } from '@/types'

interface Props {
  specKey: string
  /** Bu özellik için tanımlı hazır seçenekler */
  options: SpecOption[]
  /** "Beyaz, Ceviz" biçiminde birleşik değer (özellik tablosundaki değer) */
  value: string
  onChange: (value: string) => void
  onOptionAdded: (option: SpecOption) => void
}

const norm = (s: string) => s.toLocaleLowerCase('tr-TR')

export default function SpecOptionPicker({ specKey, options, value, onChange, onOptionAdded }: Props) {
  const selected = splitSpecValue(value)
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newColor, setNewColor] = useState('')
  const [saving, setSaving] = useState(false)
  const isColor = specKey === 'Renk'

  // Listede olmayan ama seçili değerler de görünsün (şablon / kopyadan gelmiş olabilir)
  const unknownSelected = selected.filter((v) => !options.some((o) => norm(o.value) === norm(v)))

  const isSelected = (v: string) => selected.some((s) => norm(s) === norm(v))
  const toggle = (v: string) => {
    const next = isSelected(v) ? selected.filter((s) => norm(s) !== norm(v)) : [...selected, v]
    onChange(joinSpecValue(next))
  }

  const handleAdd = async () => {
    const clean = sanitizeOptionValue(newValue)
    if (!clean) return
    setSaving(true)
    try {
      const opt = await addSpecOption(specKey, clean, isColor ? newColor || null : null)
      onOptionAdded(opt)
      if (!isSelected(opt.value)) onChange(joinSpecValue([...selected, opt.value]))
      setNewValue('')
      setNewColor('')
      setAdding(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Seçenek eklenemedi')
    } finally {
      setSaving(false)
    }
  }

  const chip = (label: string, active: boolean, hex?: string | null) => (
    <button
      key={label}
      type="button"
      onClick={() => toggle(label)}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
        active ? 'bg-[#222222] text-white border-[#222222]' : 'bg-white border-border hover:bg-muted/60'
      }`}
    >
      {hex && <span className="w-3 h-3 rounded-full border border-black/15 flex-shrink-0" style={{ backgroundColor: hex }} />}
      {active && <Check size={11} />}
      {label}
    </button>
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => chip(o.value, isSelected(o.value), o.color_hex))}
        {unknownSelected.map((v) => chip(v, true))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            <Plus size={11} /> Yeni ekle
          </button>
        )}
      </div>

      {options.length === 0 && !adding && unknownSelected.length === 0 && (
        <p className="text-xs text-muted-foreground">Henüz {specKey.toLocaleLowerCase('tr-TR')} seçeneği yok. &quot;Yeni ekle&quot; ile oluşturun.</p>
      )}

      {adding && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd() } }}
            placeholder={`Yeni ${specKey.toLocaleLowerCase('tr-TR')}`}
            className="h-8 px-2.5 rounded-lg border border-border text-sm w-44 focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
          />
          {isColor && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Renk kodu
              <input
                type="color"
                value={newColor || '#cccccc'}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-8 w-9 rounded border border-border p-0.5 bg-white"
              />
              {newColor && (
                <button type="button" onClick={() => setNewColor('')} className="underline">kaldır</button>
              )}
            </label>
          )}
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={saving || !sanitizeOptionValue(newValue)}
            className="h-8 px-3 rounded-lg bg-[#222222] text-white text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />} Ekle
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewValue('') }} className="h-8 px-3 rounded-lg border border-border text-xs">
            Vazgeç
          </button>
        </div>
      )}
    </div>
  )
}

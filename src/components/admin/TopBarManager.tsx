'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { saveTopBar } from '@/app/admin/ayarlar/actions'
import type { TopBarData, TopBarLink } from '@/components/layout/TopBar'

interface Props {
  initial: TopBarData
}

export default function TopBarManager({ initial }: Props) {
  const [enabled,   setEnabled]   = useState(initial.enabled)
  const [texts,     setTexts]     = useState<string[]>(initial.texts.length ? initial.texts : [''])
  const [interval,  setInterval]  = useState(initial.interval ?? 4)
  const [bgColor,   setBgColor]   = useState(initial.bg_color)
  const [textColor, setTextColor] = useState(initial.text_color)
  const [links,     setLinks]     = useState<TopBarLink[]>(initial.links)
  const [saving,    setSaving]    = useState(false)
  const [preview,   setPreview]   = useState(0)

  const addText    = () => setTexts(p => [...p, ''])
  const updateText = (i: number, v: string) => setTexts(p => p.map((t, idx) => idx === i ? v : t))
  const removeText = (i: number) => setTexts(p => p.filter((_, idx) => idx !== i))

  const addLink    = () => setLinks(p => [...p, { label: '', href: '' }])
  const updateLink = (i: number, field: keyof TopBarLink, v: string) =>
    setLinks(p => p.map((l, idx) => idx === i ? { ...l, [field]: v } : l))
  const removeLink = (i: number) => setLinks(p => p.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    const validTexts = texts.filter(t => t.trim())
    if (!validTexts.length) { toast.error('En az bir duyuru metni girin'); return }
    setSaving(true)
    try {
      await saveTopBar({ enabled, texts: validTexts, interval, bg_color: bgColor, text_color: textColor, links })
      toast.success('Top bar kaydedildi')
    } catch (err: any) {
      toast.error(err.message ?? 'Hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Üst Bilgi Çubuğu (Top Bar)</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setEnabled(e => !e)}
            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-[#222222]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-xs text-muted-foreground">{enabled ? 'Aktif' : 'Gizli'}</span>
        </label>
      </div>

      {/* Canlı önizleme */}
      <div
        className="rounded-xl h-9 flex items-center justify-between px-4 text-xs overflow-hidden gap-4"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="opacity-70 flex-shrink-0">🔔</span>
          <span className="font-medium opacity-90 truncate">
            {texts[preview % texts.length] || 'Duyuru metni...'}
          </span>
          {texts.filter(Boolean).length > 1 && (
            <div className="flex gap-1 flex-shrink-0">
              {texts.filter(Boolean).map((_, i) => (
                <button key={i} onClick={() => setPreview(i)}
                  className="w-1 h-1 rounded-full transition-all"
                  style={{ backgroundColor: textColor, opacity: i === preview % texts.filter(Boolean).length ? 0.9 : 0.3 }}
                />
              ))}
            </div>
          )}
        </div>
        <span className="flex gap-3 opacity-75 flex-shrink-0">
          {links.slice(0, 3).map((l, i) => <span key={i} className="hidden sm:inline">{l.label || '—'}</span>)}
        </span>
      </div>

      {/* Duyuru metinleri */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Duyuru Metinleri</label>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Sırayla otomatik değişir</p>
          </div>
          <button type="button" onClick={addText}
            className="flex items-center gap-1 text-xs text-[#222222] hover:underline font-medium">
            <Plus size={12} /> Metin Ekle
          </button>
        </div>
        <div className="space-y-2">
          {texts.map((txt, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{i + 1}.</span>
              <input
                value={txt}
                onChange={e => updateText(i, e.target.value)}
                placeholder={`Duyuru ${i + 1}...`}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
              />
              <button type="button" onClick={() => removeText(i)} disabled={texts.length === 1}
                className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-30">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Değişim süresi */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Değişim Süresi
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={2} max={15} step={1} value={interval}
            onChange={e => setInterval(Number(e.target.value))}
            className="flex-1 accent-[#222222]"
          />
          <span className="text-sm font-semibold w-16 text-right">{interval} saniye</span>
        </div>
      </div>

      {/* Renkler */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Arka Plan</label>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
            <input value={bgColor} onChange={e => setBgColor(e.target.value)}
              className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#222222]/20" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Yazı Rengi</label>
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
            <input value={textColor} onChange={e => setTextColor(e.target.value)}
              className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#222222]/20" />
          </div>
        </div>
      </div>

      {/* Sağ linkler */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-muted-foreground">Sağ Linkler</label>
          <button type="button" onClick={addLink}
            className="flex items-center gap-1 text-xs text-[#222222] hover:underline font-medium">
            <Plus size={12} /> Link Ekle
          </button>
        </div>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
              <input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)}
                placeholder="Blog" className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20" />
              <input value={link.href} onChange={e => updateLink(i, 'href', e.target.value)}
                placeholder="/blog" className="flex-1 border border-border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#222222]/20" />
              <button type="button" onClick={() => removeLink(i)}
                className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-xl">
              Henüz link yok
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 text-sm bg-[#222222] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

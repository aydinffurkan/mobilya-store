'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveTrustStats, saveTrustBandVisible } from '@/app/admin/ayarlar/actions'
import { TrustStat, TrustIconName } from '@/types'
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'

const ICON_OPTIONS: { value: TrustIconName; label: string }[] = [
  { value: 'Award',       label: 'Ödül / Deneyim'      },
  { value: 'Users',       label: 'Müşteri / Kullanıcı'  },
  { value: 'Package',     label: 'Ürün / Paket'         },
  { value: 'Truck',       label: 'Teslimat / Kargo'     },
  { value: 'Star',        label: 'Puan / Yıldız'        },
  { value: 'Shield',      label: 'Güvenlik / Garanti'   },
  { value: 'Heart',       label: 'Memnuniyet / Sevgi'   },
  { value: 'Home',        label: 'Ev / Mobilya'         },
  { value: 'CheckCircle', label: 'Onay / Kalite'        },
  { value: 'Clock',       label: 'Hız / Süre'           },
]

interface Props {
  initial: TrustStat[]
  initialVisible: boolean
}

export default function TrustStatsManager({ initial, initialVisible }: Props) {
  const [stats,   setStats]   = useState<TrustStat[]>(initial)
  const [visible, setVisible] = useState(initialVisible)
  const [saving,  setSaving]  = useState(false)
  const [toggling, setToggling] = useState(false)

  const add    = () => { if (stats.length < 6) setStats([...stats, { icon: 'Award', value: '', label: '' }]) }
  const remove = (i: number) => setStats(stats.filter((_, j) => j !== i))
  const update = (i: number, field: keyof TrustStat, val: string) =>
    setStats(stats.map((s, j) => (j === i ? { ...s, [field]: val } : s)))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...stats]
    const t = i + dir
    if (t < 0 || t >= next.length) return
    ;[next[i], next[t]] = [next[t], next[i]]
    setStats(next)
  }

  const handleToggleVisible = async () => {
    setToggling(true)
    const next = !visible
    try {
      await saveTrustBandVisible(next)
      setVisible(next)
      toast.success(next ? 'Bölüm artık görünür' : 'Bölüm gizlendi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setToggling(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveTrustStats(stats)
      toast.success('İstatistikler kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Güven İstatistikleri (Deneyim Bandı)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Slider altındaki istatistik bölümü — maks. 6 adet
          </p>
        </div>

        {/* Görünürlük toggle */}
        <button
          type="button"
          onClick={handleToggleVisible}
          disabled={toggling}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            visible
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
          } disabled:opacity-60`}
        >
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
          {toggling ? 'Kaydediliyor...' : visible ? 'Görünür' : 'Gizli'}

          {/* Toggle switch */}
          <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${visible ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </span>
        </button>
      </div>

      <div className="space-y-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 p-3 bg-secondary/40 rounded-xl overflow-x-auto">
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
                <ArrowUp size={13} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === stats.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
                <ArrowDown size={13} />
              </button>
            </div>

            <select
              value={stat.icon}
              onChange={(e) => update(i, 'icon', e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background flex-shrink-0 w-40"
            >
              {ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <Input
              value={stat.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              placeholder="örn. 20+"
              className="w-24 flex-shrink-0"
            />

            <Input
              value={stat.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="örn. Yıllık Deneyim"
              className="flex-1 min-w-0"
            />

            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        {stats.length < 6 && (
          <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm text-[#222222] hover:text-[#333333] transition-colors">
            <Plus size={15} /> İstatistik Ekle
          </button>
        )}
        <Button type="button" onClick={handleSave} disabled={saving} className="ml-auto bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
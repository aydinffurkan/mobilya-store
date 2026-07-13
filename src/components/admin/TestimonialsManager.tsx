'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveTestimonials } from '@/app/admin/ayarlar/actions'
import { Testimonial } from '@/types'
import { Plus, Trash2, Star } from 'lucide-react'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initial: Testimonial[]
  initialVisible?: boolean
}

const emptyItem = (): Testimonial => ({ name: '', location: '', rating: 5, text: '' })

export default function TestimonialsManager({ initial, initialVisible = true }: Props) {
  const [items, setItems] = useState<Testimonial[]>(initial)
  const [saving, setSaving] = useState(false)

  const add = () => setItems([...items, emptyItem()])
  const remove = (i: number) => setItems(items.filter((_, j) => j !== i))

  const update = <K extends keyof Testimonial>(i: number, field: K, val: Testimonial[K]) =>
    setItems(items.map((item, j) => j === i ? { ...item, [field]: val } : item))

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveTestimonials(items)
      toast.success('Yorumlar kaydedildi')
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
          <h2 className="font-semibold">Müşteri Yorumları</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ana sayfada gösterilecek müşteri değerlendirmeleri
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="testimonials" initialVisible={initialVisible} />
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 border border-border rounded-xl space-y-3 bg-secondary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Yorum #{i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ad Soyad</Label>
                <Input
                  value={item.name}
                  onChange={(e) => update(i, 'name', e.target.value)}
                  placeholder="örn. Ayşe Kaya"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Şehir / Konum</Label>
                <Input
                  value={item.location}
                  onChange={(e) => update(i, 'location', e.target.value)}
                  placeholder="örn. İstanbul"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Puan</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update(i, 'rating', s)}
                    className="p-0.5"
                  >
                    <Star
                      size={22}
                      className={s <= item.rating ? 'fill-[#c9a227] text-[#c9a227]' : 'fill-none text-[#ccc]'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Yorum Metni</Label>
              <textarea
                value={item.text}
                onChange={(e) => update(i, 'text', e.target.value)}
                placeholder="Müşteri yorumunu buraya girin..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-sm text-[#222222] hover:text-[#333333] transition-colors"
        >
          <Plus size={15} /> Yorum Ekle
        </button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ml-auto bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
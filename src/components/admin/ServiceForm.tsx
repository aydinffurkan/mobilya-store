'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveService } from '@/app/admin/hizmetler/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Service { id: string; icon: string; title: string; description: string; sort_order: number; is_active: boolean }

export default function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter()
  const isEdit = !!service
  const [icon, setIcon] = useState(service?.icon ?? '')
  const [title, setTitle] = useState(service?.title ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [sortOrder, setSortOrder] = useState(service?.sort_order ?? 0)
  const [isActive, setIsActive] = useState(service?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { icon, title, description, sort_order: sortOrder, is_active: isActive }

    try {
      await saveService(isEdit ? service.id : null, payload)
      toast.success(isEdit ? 'Hizmet güncellendi' : 'Hizmet eklendi')
      router.push('/admin/hizmetler')
    } catch (e: any) {
      toast.error((isEdit ? 'Güncelleme başarısız: ' : 'Ekleme başarısız: ') + e.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>İkon (emoji)</Label>
            <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="🚚" required />
          </div>
          <div className="space-y-1.5">
            <Label>Sıra</Label>
            <Input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} min={0} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Başlık</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Açıklama</Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-[#222222] w-4 h-4" />
              <span className="text-sm font-medium">Aktif (sitede görünsün)</span>
            </label>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Hizmet Ekle'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
      </div>
    </form>
  )
}

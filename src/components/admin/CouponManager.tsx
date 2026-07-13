'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCoupons, CouponDef } from '@/app/admin/ayarlar/actions'
import { Plus, Pencil, Trash2, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'

interface Props {
  initial: CouponDef[]
}

const emptyCoupon = (): CouponDef => ({
  code: '',
  type: 'percent',
  value: 10,
  min_amount: 0,
  active: true,
  expires_at: '',
})

export default function CouponManager({ initial }: Props) {
  const [coupons, setCoupons] = useState<CouponDef[]>(initial)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<CouponDef | null>(null)
  const [saving, setSaving] = useState(false)

  const persist = async (next: CouponDef[], msg: string) => {
    setSaving(true)
    try {
      await saveCoupons(next)
      setCoupons(next)
      toast.success(msg)
      setAdding(false)
      setEditingIndex(null)
      setForm(null)
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  const startAdd = () => {
    setEditingIndex(null)
    setAdding(true)
    setForm(emptyCoupon())
  }

  const startEdit = (i: number) => {
    setAdding(false)
    setEditingIndex(i)
    setForm({ ...coupons[i] })
  }

  const cancel = () => {
    setAdding(false)
    setEditingIndex(null)
    setForm(null)
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.code.trim()) { toast.error('Kupon kodu zorunlu'); return }
    if (!form.value || form.value <= 0) { toast.error('İndirim değeri sıfırdan büyük olmalı'); return }
    if (form.type === 'percent' && form.value > 100) { toast.error('Yüzde indirim 100\'den fazla olamaz'); return }

    const normalized = { ...form, code: form.code.trim().toUpperCase() }

    // Check duplicate code (excluding current edit)
    const duplicate = coupons.some(
      (c, i) => c.code.toLowerCase() === normalized.code.toLowerCase() && i !== editingIndex
    )
    if (duplicate) { toast.error('Bu kod zaten mevcut'); return }

    const next = editingIndex !== null
      ? coupons.map((c, i) => (i === editingIndex ? normalized : c))
      : [...coupons, normalized]

    await persist(next, editingIndex !== null ? 'Kupon güncellendi' : 'Kupon eklendi')
  }

  const handleDelete = async (i: number) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return
    await persist(coupons.filter((_, idx) => idx !== i), 'Kupon silindi')
  }

  const toggleActive = async (i: number) => {
    const next = coupons.map((c, idx) => idx === i ? { ...c, active: !c.active } : c)
    await persist(next, `Kupon ${next[i].active ? 'aktif' : 'pasif'} edildi`)
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Tag size={16} className="text-[#222222]" />
            Kupon Kodları
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sepette uygulanabilecek indirim kuponlarını yönetin.
          </p>
        </div>
        {!adding && editingIndex === null && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
            <Plus size={14} className="mr-1" /> Kupon Ekle
          </Button>
        )}
      </div>

      {coupons.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">Henüz kupon eklenmemiş.</p>
      )}

      <div className="space-y-2">
        {coupons.map((coupon, i) => (
          <div key={i}>
            {editingIndex === i && form ? (
              <CouponForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} />
            ) : (
              <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-bold text-sm tracking-wide">{coupon.code}</code>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                      coupon.type === 'percent'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {coupon.type === 'percent' ? `-%${coupon.value}` : `-${coupon.value.toLocaleString('tr-TR')} ₺`}
                    </span>
                    {!coupon.active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pasif</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {coupon.min_amount > 0 && `Min. sepet: ${coupon.min_amount.toLocaleString('tr-TR')} ₺`}
                    {coupon.min_amount > 0 && coupon.expires_at && ' · '}
                    {coupon.expires_at && `Son: ${new Date(coupon.expires_at).toLocaleDateString('tr-TR')}`}
                    {coupon.min_amount === 0 && !coupon.expires_at && 'Tüm sepetlerde geçerli'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleActive(i)}
                    disabled={saving}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title={coupon.active ? 'Pasif yap' : 'Aktif yap'}
                  >
                    {coupon.active
                      ? <ToggleRight size={16} className="text-green-600" />
                      : <ToggleLeft size={16} />}
                  </button>
                  <button type="button" onClick={() => startEdit(i)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(i)} disabled={saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-30">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && form && (
          <CouponForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} />
        )}
      </div>
    </div>
  )
}

function CouponForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: CouponDef
  setForm: (f: CouponDef) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-4 bg-[#222222]/5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kupon Kodu *</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="örn. HOSGELDIN10"
            className="font-mono tracking-wide"
          />
        </div>
        <div className="space-y-1.5">
          <Label>İndirim Türü *</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 bg-background"
          >
            <option value="percent">Yüzde (%)</option>
            <option value="fixed">Sabit tutar (₺)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>{form.type === 'percent' ? 'İndirim (%)' : 'İndirim (₺)'} *</Label>
          <Input
            type="number"
            min={1}
            max={form.type === 'percent' ? 100 : undefined}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            placeholder={form.type === 'percent' ? '10' : '500'}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Min. Sepet Tutarı (₺)</Label>
          <Input
            type="number"
            min={0}
            value={form.min_amount}
            onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })}
            placeholder="0 = limitsiz"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Son Kullanma Tarihi</Label>
          <Input
            type="date"
            value={form.expires_at ?? ''}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          className="accent-[#222222] w-4 h-4"
        />
        <span className="text-sm font-medium">Aktif (kullanıma açık)</span>
      </label>

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Landmark, Plus, Trash2 } from 'lucide-react'
import { saveHavale, type HavaleSettings, type BankAccount } from '@/app/admin/odeme/actions'

const emptyAccount = (): BankAccount => ({
  id: crypto.randomUUID(), bank_name: '', account_name: '', iban: '', branch: '',
})

export default function HavaleManager({ initial }: { initial: HavaleSettings }) {
  const [s, setS]           = useState<HavaleSettings>(initial)
  const [saving, setSaving] = useState(false)

  const setAccounts = (accounts: BankAccount[]) => setS((p) => ({ ...p, accounts }))

  const addAccount = () => setAccounts([...s.accounts, emptyAccount()])

  const removeAccount = (id: string) => setAccounts(s.accounts.filter((a) => a.id !== id))

  const updateAccount = (id: string, patch: Partial<BankAccount>) =>
    setAccounts(s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const handleSave = async () => {
    const invalid = s.accounts.some((a) => !a.bank_name || !a.account_name || !a.iban)
    if (invalid) { toast.error('Tüm banka alanlarını doldurun (IBAN, banka adı, hesap adı)'); return }
    setSaving(true)
    try {
      await saveHavale(s)
      toast.success('Havale/EFT ayarları kaydedildi')
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-border rounded-2xl p-5 bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
          <Landmark size={18} className="text-violet-600" />
        </div>
        <div>
          <h2 className="font-bold text-sm">Havale / EFT</h2>
          <p className="text-xs text-muted-foreground">Müşteri banka hesabına havale ile öder</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={s.enabled}
          onClick={() => setS((p) => ({ ...p, enabled: !p.enabled }))}
          className={`ml-auto relative w-10 h-6 rounded-full transition-colors ${s.enabled ? 'bg-green-500' : 'bg-muted'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {s.enabled && (
        <>
          <div className="space-y-1.5">
            <Label>Açıklama <span className="text-muted-foreground font-normal text-xs">(checkout'ta gösterilir)</span></Label>
            <Input
              value={s.description}
              onChange={(e) => setS((p) => ({ ...p, description: e.target.value }))}
              placeholder="Sipariş numarasını açıklama olarak yazarak havale yapabilirsiniz."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Banka Hesapları</p>
              <button
                type="button"
                onClick={addAccount}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={13} /> Hesap Ekle
              </button>
            </div>

            {s.accounts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                Henüz banka hesabı eklenmedi
              </p>
            )}

            {s.accounts.map((acc) => (
              <div key={acc.id} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Banka Hesabı</span>
                  <button
                    type="button"
                    onClick={() => removeAccount(acc.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Banka Adı *</Label>
                    <Input
                      value={acc.bank_name}
                      onChange={(e) => updateAccount(acc.id, { bank_name: e.target.value })}
                      placeholder="Ziraat Bankası"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hesap Adı *</Label>
                    <Input
                      value={acc.account_name}
                      onChange={(e) => updateAccount(acc.id, { account_name: e.target.value })}
                      placeholder="Mobilya Mağazası A.Ş."
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">IBAN *</Label>
                    <Input
                      value={acc.iban}
                      onChange={(e) => updateAccount(acc.id, { iban: e.target.value.toUpperCase() })}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Şube <span className="text-muted-foreground">(opsiyonel)</span></Label>
                    <Input
                      value={acc.branch}
                      onChange={(e) => updateAccount(acc.id, { branch: e.target.value })}
                      placeholder="Merkez Şube"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  )
}

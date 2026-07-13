'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Search, Loader2, Plus, Minus, User, Coins, AlertCircle } from 'lucide-react'
import { findUserByEmail, awardManualPoints } from '@/app/admin/puanlar/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FoundUser {
  id: string
  email: string
  full_name: string
  balance: number
}

export default function ManualPointsForm() {
  const [email, setEmail]     = useState('')
  const [searching, setSearching] = useState(false)
  const [found, setFound]     = useState<FoundUser | null | false>(undefined as unknown as false)
  const [points, setPoints]   = useState('')
  const [note, setNote]       = useState('')
  const [mode, setMode]       = useState<'add' | 'deduct'>('add')
  const [saving, setSaving]   = useState(false)

  const handleSearch = async () => {
    if (!email.trim()) { toast.error('E-posta girin'); return }
    setSearching(true)
    setFound(undefined as unknown as false)
    try {
      const user = await findUserByEmail(email.trim())
      setFound(user)
      if (!user) toast.error('Bu e-posta ile kayıtlı kullanıcı bulunamadı')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setSearching(false)
    }
  }

  const handleAward = async () => {
    if (!found) return
    const pts = parseInt(points, 10)
    if (isNaN(pts) || pts <= 0) { toast.error('Geçerli bir puan miktarı girin'); return }

    const finalPoints = mode === 'deduct' ? -pts : pts

    if (mode === 'deduct' && pts > found.balance) {
      toast.error(`Kullanıcının yalnızca ${found.balance} puanı var`)
      return
    }

    setSaving(true)
    try {
      await awardManualPoints(found.id, finalPoints, note)
      toast.success(`${found.email} için ${mode === 'add' ? '+' : '-'}${pts} puan işlemi yapıldı`)
      setFound({ ...found, balance: Math.max(0, found.balance + finalPoints) })
      setPoints('')
      setNote('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* E-posta arama */}
      <div className="space-y-1.5">
        <Label>Kullanıcı E-postası</Label>
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFound(undefined as unknown as false) }}
            placeholder="ornek@eposta.com"
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSearch()}
            disabled={searching}
          >
            {searching
              ? <Loader2 size={14} className="animate-spin" />
              : <Search size={14} />
            }
            {searching ? 'Aranıyor...' : 'Bul'}
          </Button>
        </div>
      </div>

      {/* Kullanıcı bulunamadı */}
      {found === null && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle size={14} className="text-red-500" />
          <p className="text-sm text-red-700">Bu e-posta ile kullanıcı bulunamadı.</p>
        </div>
      )}

      {/* Kullanıcı bulundu */}
      {found && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-xl">
            <div className="w-9 h-9 rounded-full bg-[#222222]/15 flex items-center justify-center flex-shrink-0">
              <User size={15} className="text-[#222222]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-800">{found.full_name || '—'}</p>
              <p className="text-xs text-muted-foreground">{found.email}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Coins size={14} className="text-amber-500" />
              <span className="text-sm font-bold text-neutral-800">{found.balance.toLocaleString('tr-TR')}</span>
              <span className="text-xs text-muted-foreground">puan</span>
            </div>
          </div>

          {/* İşlem tipi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                mode === 'add'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-neutral-600 border-border hover:border-green-400'
              }`}
            >
              <Plus size={14} /> Puan Ver
            </button>
            <button
              type="button"
              onClick={() => setMode('deduct')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                mode === 'deduct'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-neutral-600 border-border hover:border-red-400'
              }`}
            >
              <Minus size={14} /> Puan Düş
            </button>
          </div>

          {/* Puan miktarı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Puan Miktarı</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Ör. 200"
                  min={1}
                  max={mode === 'deduct' ? found.balance : undefined}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">puan</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Not <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="İşlem açıklaması..."
              />
            </div>
          </div>

          {/* Özet */}
          {points && !isNaN(parseInt(points)) && parseInt(points) > 0 && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${
              mode === 'add'
                ? 'bg-green-50 border-green-100 text-green-800'
                : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              {mode === 'add' ? <Plus size={13} /> : <Minus size={13} />}
              <span>
                {found.full_name || found.email} →{' '}
                <strong>
                  {mode === 'add' ? '+' : '-'}{parseInt(points).toLocaleString('tr-TR')} puan
                </strong>
                {mode === 'add' && (
                  <span className="text-xs ml-1 opacity-70">
                    (yeni bakiye: ~{(found.balance + parseInt(points)).toLocaleString('tr-TR')})
                  </span>
                )}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleAward()}
            disabled={saving || !points || isNaN(parseInt(points)) || parseInt(points) <= 0}
            className={`flex items-center gap-2 px-5 py-2 text-white text-sm font-medium rounded-xl transition-opacity disabled:opacity-50 ${
              mode === 'add' ? 'bg-green-600 hover:opacity-80' : 'bg-red-600 hover:opacity-80'
            }`}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" />İşleniyor...</>
              : mode === 'add'
              ? <><Plus size={14} />Puan Ver</>
              : <><Minus size={14} />Puan Düş</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UserPlus, Trash2, ShieldCheck, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { createSubAdmin, deleteSubAdmin, type AdminUser } from '@/app/admin/adminler/actions'
import { formatDateTR } from '@/lib/format'

interface Props {
  initialAdmins: AdminUser[]
  ownerId: string
}

export default function AdminManager({ initialAdmins, ownerId }: Props) {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [busy,     setBusy]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async () => {
    if (busy) return
    setBusy(true)
    try {
      await createSubAdmin({ email, password })
      toast.success('Alt admin eklendi')
      setEmail('')
      setPassword('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Eklenemedi')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (admin: AdminUser) => {
    if (!confirm(`${admin.email} adlı alt admini silmek istediğinize emin misiniz?`)) return
    setDeleting(admin.id)
    try {
      await deleteSubAdmin(admin.id)
      toast.success('Alt admin silindi')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Ekleme formu */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <UserPlus size={16} /> Alt Admin Ekle
        </h2>
        <form
          onSubmit={(e) => { e.preventDefault(); void handleCreate() }}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-posta</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ornek.com"
                required
                className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Şifre <span className="opacity-60">(en az 8 karakter)</span></label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full border border-border rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="h-[42px] px-5 bg-[#222222] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Ekle
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          Eklenen kişi bu e-posta ve şifreyle hemen giriş yapabilir ve admin panelinin tamamına erişir.
        </p>
      </div>

      {/* Liste */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Mevcut Adminler ({initialAdmins.length})</h2>
        </div>
        <ul className="divide-y divide-border">
          {initialAdmins.map((admin) => (
            <li key={admin.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${admin.is_owner ? 'bg-[#c9a84c]/15 text-[#a5852f]' : 'bg-neutral-100 text-neutral-500'}`}>
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-800 truncate">{admin.email}</p>
                <p className="text-xs text-muted-foreground">Eklendi: {formatDateTR(admin.created_at)}</p>
              </div>
              {admin.is_owner ? (
                <span className="text-[11px] font-semibold text-[#a5852f] bg-[#c9a84c]/15 px-2.5 py-1 rounded-full flex-shrink-0">
                  Owner (Siz)
                </span>
              ) : (
                <>
                  <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full flex-shrink-0">
                    Alt Admin
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(admin)}
                    disabled={deleting === admin.id}
                    aria-label="Alt admini sil"
                    className="flex-shrink-0 w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {deleting === admin.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

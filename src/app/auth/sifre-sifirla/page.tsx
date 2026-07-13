'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (password.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return }
    if (password !== confirm) { toast.error('Şifreler eşleşmiyor'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error('Şifre güncellenemedi: ' + error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/auth/giris'), 2500)
    }
  }

  return (
    <div className="min-h-[72vh] flex items-center justify-center px-4 py-14 bg-[#FAF8F4]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#222222]/10 items-center justify-center mb-4">
            <ShieldCheck size={22} className="text-[#222222]" />
          </div>
          <h1 className="text-2xl font-bold">Yeni şifre belirle</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Hesabınız için güçlü bir şifre oluşturun</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-7 shadow-sm">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold mb-1">Şifre güncellendi!</p>
              <p className="text-sm text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz…</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    autoFocus
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Şifre Tekrar</Label>
                <Input
                  id="confirm"
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  required
                />
              </div>
              {password && confirm && password !== confirm && (
                <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white font-semibold h-11"
              >
                {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
              </Button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-border text-center">
            <Link href="/auth/giris" className="text-sm text-muted-foreground hover:text-[#222222] transition-colors">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
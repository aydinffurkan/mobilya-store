'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/sifre-sifirla`,
    })
    setLoading(false)
    if (error) {
      toast.error('Gönderilemedi: ' + error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-[72vh] flex items-center justify-center px-4 py-14 bg-[#FAF8F4]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#222222]/10 items-center justify-center mb-4">
            <KeyRound size={22} className="text-[#222222]" />
          </div>
          <h1 className="text-2xl font-bold">Şifremi unuttum</h1>
          <p className="text-muted-foreground text-sm mt-1.5">E-postanıza sıfırlama bağlantısı gönderelim</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-7 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold mb-1">E-posta gönderildi!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{email}</span> adresini kontrol edin.
                Spam klasörünü de incelemeyi unutmayın.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta adresi</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white font-semibold h-11"
              >
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </Button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-border text-center">
            <Link href="/auth/giris" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#222222] transition-colors">
              <ArrowLeft size={13} /> Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
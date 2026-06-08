'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)

    if (error) {
      toast.error('Kayıt başarısız: ' + error.message)
    } else {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      toast.success('Kayıt başarılı! Hoş geldiniz.')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-border rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-xl font-bold text-[#8B6914]">
            MOBİLYA<span className="text-foreground">STORE</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#8B6914] hover:bg-[#7a5c12] text-white font-semibold">
            {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Zaten hesabınız var mı?{' '}
          <Link href="/auth/giris" className="text-[#8B6914] hover:underline font-medium">Giriş Yap</Link>
        </p>
      </div>
    </div>
  )
}

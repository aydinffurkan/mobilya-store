'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (password.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) {
      toast.error('Kayıt başarısız: ' + error.message)
    } else {
      if (data.user) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id)
      }
      if (data.session?.access_token) {
        void fetch('/api/points/award-signup', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        }).catch(() => {})
      }
      toast.success('Kayıt başarılı! Hoş geldiniz.')
      router.push('/')
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px]">

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 mb-8">
          <Link href="/auth/giris" className="flex-1 pb-3 text-[15px] font-medium text-neutral-400 hover:text-neutral-600 transition-colors text-center">
            Giriş Yap
          </Link>
          <button className="relative flex-1 pb-3 text-[15px] font-semibold text-neutral-900">
            Ben Yeniyim!
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900" />
          </button>
        </div>

        {/* Google */}
        <GoogleSignInButton label="Google ile üye ol" />

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#FAF8F4] px-4 text-[12px] text-neutral-400">veya e-posta ile devam et</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); void handleRegister() }} className="space-y-4">

          {/* Full name */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <User size={16} />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ad Soyad"
              required
              autoFocus
              className="w-full h-[52px] pl-11 pr-4 bg-neutral-100 rounded-xl text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:bg-white transition-all"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Posta"
              required
              className="w-full h-[52px] pl-11 pr-4 bg-neutral-100 rounded-xl text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:bg-white transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <Lock size={16} />
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 6 karakter)"
              required
              className="w-full h-[52px] pl-11 pr-12 bg-neutral-100 rounded-xl text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-[14px] tracking-wide uppercase rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Kayıt Olunuyor...' : 'Üye Ol'}
          </button>
        </form>

        <p className="text-[12px] text-neutral-400 text-center mt-5 leading-relaxed">
          Kayıt olarak{' '}
          <Link href="/gizlilik" className="underline hover:text-neutral-700">Gizlilik Politikası</Link>
          {' '}ve{' '}
          <Link href="/kullanim-sartlari" className="underline hover:text-neutral-700">Kullanım Şartları</Link>
          {"'nı"} kabul etmiş olursunuz.
        </p>

      </div>
    </div>
  )
}

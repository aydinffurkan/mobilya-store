'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

function LoginForm() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()

  const handleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('E-posta veya şifre hatalı')
    } else {
      // Hoşgeldin MessaPuanı — idempotent, zaten verilmişse tekrar eklemez
      if (data.session?.access_token) {
        void fetch('/api/points/award-signup', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        }).catch(() => {})
      }
      toast.success('Giriş başarılı!')
      const redirect = searchParams.get('redirect')
      if (redirect) router.push(redirect)
      else if (data.user?.app_metadata?.role === 'admin') router.push('/admin')
      else router.push('/')
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px]">

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 mb-8">
          <button className="relative flex-1 pb-3 text-[15px] font-semibold text-neutral-900">
            Giriş Yap
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900" />
          </button>
          <Link href="/auth/kayit" className="flex-1 pb-3 text-[15px] font-medium text-neutral-400 hover:text-neutral-600 transition-colors text-center">
            Ben Yeniyim!
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); void handleLogin() }} className="space-y-4">

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
              autoFocus
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
              placeholder="Şifre"
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

          {/* Forgot password */}
          <div className="text-right -mt-1">
            <Link href="/auth/sifremi-unuttum" className="text-[13px] text-neutral-500 hover:text-neutral-800 transition-colors underline underline-offset-2">
              Şifremi unuttum
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-[14px] tracking-wide uppercase rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#FAF8F4] px-4 text-[12px] text-neutral-400">Ya da bunlarla giriş yapabilirsin</span>
          </div>
        </div>

        {/* Google */}
        <GoogleSignInButton redirectPath={searchParams.get('redirect') ?? '/'} />

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

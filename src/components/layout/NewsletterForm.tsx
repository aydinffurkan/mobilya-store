'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Kayıt başarısız')
      setStatus('done')
      setEmail('')
      setConsent(false)
    } catch (e: unknown) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Kayıt başarısız')
    }
  }

  if (status === 'done') {
    return <p className="text-sm text-emerald-700 font-medium">Bültenimize başarıyla kaydoldunuz.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 max-w-sm">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !consent}
          className="flex items-center gap-1.5 bg-[#222222] hover:bg-[#222222] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Kaydol
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-neutral-500 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="accent-[#222222] w-3.5 h-3.5 mt-0.5"
        />
        Kampanya ve fırsatlardan haberdar olmak için Ticari Elektronik İleti almayı onaylıyorum.
      </label>
      {status === 'error' && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}

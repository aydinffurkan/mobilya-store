'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { User, Mail, Phone, Tag, Send } from 'lucide-react'

interface FormState {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const EMPTY: FormState = { name: '', email: '', phone: '', subject: '', message: '' }

const inputClass =
  'w-full h-[52px] pl-11 pr-4 bg-neutral-100 rounded-xl text-[14px] text-neutral-800 ' +
  'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:bg-white transition-all'

export default function ContactForm() {
  const [form, setForm]       = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? 'Mesaj gönderilemedi')
        return
      }
      toast.success('Mesajınız alındı, en kısa sürede dönüş yapacağız.')
      setForm(EMPTY)
    } catch {
      toast.error('Bağlantı hatası, lütfen tekrar deneyin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <User size={16} />
          </div>
          <input type="text" value={form.name} onChange={update('name')} placeholder="Ad Soyad" required className={inputClass} />
        </div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Phone size={16} />
          </div>
          <input type="tel" value={form.phone} onChange={update('phone')} placeholder="Telefon (opsiyonel)" className={inputClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Mail size={16} />
          </div>
          <input type="email" value={form.email} onChange={update('email')} placeholder="E-Posta" required className={inputClass} />
        </div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Tag size={16} />
          </div>
          <input type="text" value={form.subject} onChange={update('subject')} placeholder="Konu" required className={inputClass} />
        </div>
      </div>

      <textarea
        value={form.message}
        onChange={update('message')}
        placeholder="Mesajınız"
        required
        rows={6}
        className="w-full p-4 bg-neutral-100 rounded-xl text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:bg-white transition-all resize-y"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 h-[52px] px-8 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-[14px] tracking-wide uppercase rounded-xl transition-colors disabled:opacity-60"
      >
        <Send size={16} />
        {loading ? 'Gönderiliyor...' : 'Mesaj Gönder'}
      </button>
    </form>
  )
}
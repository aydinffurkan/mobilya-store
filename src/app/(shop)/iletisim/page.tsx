import type { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { getContactSettings } from '@/lib/repositories/settings'
import ContactForm from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'İletişim | MobilyaStore',
  description: 'MobilyaStore ile iletişime geçin — telefon, e-posta ve adres bilgileri ile iletişim formu.',
}

export default async function IletisimPage() {
  const contact = await getContactSettings()

  const cards = [
    { Icon: Phone, label: 'Telefon', value: contact.phone,   href: `tel:${contact.phone.replace(/\s/g, '')}` },
    { Icon: Mail,  label: 'E-Posta', value: contact.email,   href: `mailto:${contact.email}` },
    { Icon: MapPin, label: 'Adres',  value: contact.address, href: undefined },
    { Icon: Clock, label: 'Çalışma Saatleri', value: 'Haftaiçi 09:00 – 18:00', href: undefined },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-light tracking-wide text-neutral-900 mb-3">İletişim</h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-12">
          Sorularınız, önerileriniz veya sipariş talepleriniz için bize ulaşın. En kısa sürede size dönüş yapacağız.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
        {/* İletişim bilgileri */}
        <div className="lg:col-span-2 space-y-4">
          {cards.map(({ Icon, label, value, href }) => {
            const inner = (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-neutral-900/5 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-neutral-700" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm text-neutral-800 leading-relaxed">{value}</p>
                </div>
              </div>
            )
            return href ? (
              <a key={label} href={href} className="block">{inner}</a>
            ) : (
              <div key={label}>{inner}</div>
            )
          })}
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-neutral-800 mb-6">Bize Yazın</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
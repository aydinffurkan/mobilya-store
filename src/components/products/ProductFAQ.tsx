'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { FAQItem } from '@/types'

const STATIC_FAQ: FAQItem[] = [
  {
    q: 'Bu ürünü nasıl monte edebilirim?',
    a: 'Her ürünümüzle birlikte detaylı montaj talimatı ve gerekli tüm aksesuar gönderilmektedir. Ayrıca kurulum ekibimiz randevu ile ücretsiz montaj hizmeti sunmaktadır.',
  },
  {
    q: 'Ürün hangi malzemeden üretilmiştir?',
    a: 'Ürünlerimiz 1. sınıf E1 kalite suntalam / MDF lam malzemeden üretilmektedir. Sağlığa zararlı madde içermez ve Avrupa standartlarına uygundur.',
  },
  {
    q: 'Kargo ve teslimat süreci nasıl işliyor?',
    a: 'Siparişleriniz hazırlanma sürecinin ardından anlaşmalı kargo firmamız aracılığıyla adresinize teslim edilir. Teslimat süresi genellikle 3–7 iş gününde tamamlanmaktadır.',
  },
  {
    q: 'İade ve değişim koşulları nelerdir?',
    a: 'Ürünlerimiz teslimattan itibaren 30 gün içinde iade edilebilir. Hasarlı veya hatalı ürünlerde ücretsiz iade ve değişim sağlanır.',
  },
  {
    q: 'Ödeme seçenekleri nelerdir?',
    a: 'Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme yöntemlerini kabul etmekteyiz. Havale/EFT ödemelerinde %3 ek indirim uygulanır.',
  },
]

interface Props {
  items?: FAQItem[]
}

export default function ProductFAQ({ items }: Props) {
  const faqItems = items && items.length > 0 ? items : STATIC_FAQ
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <section className="mt-16 md:mt-24 bg-neutral-50 rounded-3xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">

        {/* ── Sol: başlık + iletişim ── */}
        <div className="lg:col-span-2 px-8 py-10 md:px-12 md:py-14 flex flex-col justify-between gap-8 lg:border-r border-neutral-200">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold tracking-[.2em] uppercase text-[#222222]">SSS</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-wide text-neutral-900 leading-snug">
              Sıkça Sorulan<br />Sorular
            </h2>
            <p className="text-sm font-light text-neutral-500 leading-relaxed max-w-xs">
              Bu ürünle ilgili merak ettiklerinizi aşağıda bulabilirsiniz. Başka sorularınız için bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-700">
                Müşteri destek ekibimiz pazartesi–cuma günleri 09:00–18:00 saatleri arasında hizmetinizdedir.
              </p>
              <p className="text-xs text-neutral-400">Ortalama yanıt süresi: 24 saat</p>
            </div>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle size={15} />
              Bize Ulaşın
            </Link>
          </div>
        </div>

        {/* ── Sağ: S&C listesi ── */}
        <div className="lg:col-span-3 divide-y divide-neutral-200 border-t border-neutral-200 lg:border-t-0">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-start justify-between gap-4 px-7 py-5 text-left hover:bg-neutral-50/70 transition-colors focus:outline-none"
              >
                <span className={`text-sm font-semibold leading-snug transition-colors ${openIndex === i ? 'text-[#222222]' : 'text-neutral-800'}`}>
                  {item.q}
                </span>
                <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${openIndex === i ? 'bg-[#222222] text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-7 pb-6 text-sm font-light text-neutral-600 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
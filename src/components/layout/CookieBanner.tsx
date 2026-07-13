'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEYS = {
  done: 'cookie_consent',
  analytics: 'cookie_consent_analytics',
  marketing: 'cookie_consent_marketing',
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEYS.done)) {
      setVisible(true)
    }
  }, [])

  function save(analyticsVal: boolean, marketingVal: boolean) {
    localStorage.setItem(KEYS.done, 'done')
    localStorage.setItem(KEYS.analytics, analyticsVal ? 'accepted' : 'declined')
    localStorage.setItem(KEYS.marketing, marketingVal ? 'accepted' : 'declined')
    window.dispatchEvent(new Event('cookie_consent_change'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🍪</span>
          <h2 className="text-lg font-semibold text-neutral-900">Çerez Tercihleri</h2>
        </div>

        <p className="text-sm text-neutral-600 leading-relaxed mb-6">
          Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Aşağıdan tercihlerinizi yönetebilirsiniz.{' '}
          <Link href="/cerez-politikasi" className="text-[#c9a84c] underline underline-offset-2 hover:text-[#b8953e] transition-colors">
            Çerez Politikası
          </Link>
        </p>

        <div className="space-y-4 mb-7">
          {/* Zorunlu */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-800">Zorunlu</p>
              <p className="text-xs text-neutral-500 mt-0.5">Oturum yönetimi için gereklidir, devre dışı bırakılamaz.</p>
            </div>
            <span className="text-xs text-green-600 font-medium whitespace-nowrap mt-0.5 flex-shrink-0">Her zaman aktif</span>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Analitik */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-800">Analitik</p>
              <p className="text-xs text-neutral-500 mt-0.5">Ziyaretçi istatistikleri (Google Analytics).</p>
            </div>
            <button
              role="switch"
              aria-checked={analytics}
              onClick={() => setAnalytics((v) => !v)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${analytics ? 'bg-[#c9a84c]' : 'bg-neutral-200'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${analytics ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Pazarlama */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-800">Pazarlama</p>
              <p className="text-xs text-neutral-500 mt-0.5">Hedefli reklamlar (Facebook Pixel).</p>
            </div>
            <button
              role="switch"
              aria-checked={marketing}
              onClick={() => setMarketing((v) => !v)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${marketing ? 'bg-[#c9a84c]' : 'bg-neutral-200'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${marketing ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => save(false, false)}
            className="flex-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 px-4 py-2.5 rounded-lg transition-colors"
          >
            Sadece Zorunlu
          </button>
          <button
            onClick={() => save(analytics, marketing)}
            className="flex-1 text-xs text-neutral-700 hover:text-neutral-900 border border-neutral-300 hover:border-neutral-500 px-4 py-2.5 rounded-lg transition-colors font-medium"
          >
            Seçimi Kaydet
          </button>
          <button
            onClick={() => save(true, true)}
            className="flex-1 text-xs text-white bg-[#c9a84c] hover:bg-[#b8953e] px-4 py-2.5 rounded-lg transition-colors font-medium"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  )
}
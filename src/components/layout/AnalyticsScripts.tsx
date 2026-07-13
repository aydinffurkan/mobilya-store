'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface Props {
  gaId: string
  fbPixelId: string
}

function readConsent() {
  return {
    analytics: localStorage.getItem('cookie_consent_analytics') === 'accepted',
    marketing: localStorage.getItem('cookie_consent_marketing') === 'accepted',
  }
}

export default function AnalyticsScripts({ gaId, fbPixelId }: Props) {
  const [consent, setConsent] = useState({ analytics: false, marketing: false })

  useEffect(() => {
    setConsent(readConsent())
    const handler = () => setConsent(readConsent())
    window.addEventListener('cookie_consent_change', handler)
    return () => window.removeEventListener('cookie_consent_change', handler)
  }, [])

  return (
    <>
      {consent.analytics && gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}</Script>
        </>
      )}

      {consent.marketing && fbPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${fbPixelId}');
          fbq('track', 'PageView');
        `}</Script>
      )}
    </>
  )
}
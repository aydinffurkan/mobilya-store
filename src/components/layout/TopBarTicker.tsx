'use client'

import { useEffect, useState } from 'react'

interface Props {
  texts: string[]
  interval: number
  textColor: string
}

export default function TopBarTicker({ texts, interval, textColor }: Props) {
  const [index,   setIndex]   = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (texts.length <= 1) return
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % texts.length)
        setVisible(true)
      }, 400)
    }, interval * 1000)
    return () => clearInterval(timer)
  }, [texts.length, interval])

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
      {/* Zil */}
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="flex-shrink-0"
        style={{ color: textColor, opacity: 0.7 }}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Metin */}
      <span
        className="text-xs font-medium truncate transition-opacity duration-300"
        style={{ color: textColor, opacity: visible ? 0.92 : 0 }}
      >
        {texts[index] ?? ''}
      </span>

      {/* Nokta indikatörleri */}
      {texts.length > 1 && (
        <div className="flex gap-1 flex-shrink-0 ml-1">
          {texts.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-opacity duration-300"
              style={{ backgroundColor: textColor, opacity: i === index ? 0.9 : 0.3 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

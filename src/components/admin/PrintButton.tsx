'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="hidden md:flex items-center gap-1.5 h-9 px-3 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
    >
      <Printer size={14} /> Yazdır
    </button>
  )
}
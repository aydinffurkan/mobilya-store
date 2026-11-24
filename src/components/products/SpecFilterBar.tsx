'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { FacetGroup } from '@/lib/productSpecs'

interface Props {
  groups: FacetGroup[]
  /** param → seçili değerler */
  selected: Record<string, string[]>
  onApply: (param: string, values: string[]) => void
}

/** Renk / Kapak Adedi / Malzeme filtreleri: grup butonu → seçenek paneli → Uygula */
export default function SpecFilterBar({ groups, selected, onApply }: Props) {
  const [openParam, setOpenParam] = useState<string | null>(null)
  const [pending, setPending] = useState<string[]>([])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenParam(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (groups.length === 0) return null

  const toggleGroup = (param: string) => {
    if (openParam === param) { setOpenParam(null); return }
    setPending(selected[param] ?? [])
    setOpenParam(param)
  }

  const openGroup = groups.find((g) => g.param === openParam)

  const togglePending = (value: string) =>
    setPending((p) => (p.includes(value) ? p.filter((v) => v !== value) : [...p, value]))

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const count = selected[g.param]?.length ?? 0
          const isOpen = openParam === g.param
          return (
            <button
              key={g.param}
              type="button"
              onClick={() => toggleGroup(g.param)}
              aria-expanded={isOpen}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                count > 0 || isOpen
                  ? 'border-[#222222] text-[#222222] bg-[#222222]/5'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {g.label}
              {count > 0 && <span className="bg-[#222222] text-white rounded-full px-1.5 text-[10px] leading-4">{count}</span>}
              <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )
        })}
      </div>

      {openGroup && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2.5">
            {openGroup.options.map((o) => {
              const checked = pending.includes(o.value)
              const disabled = o.count === 0 && !checked
              return (
                <label
                  key={o.value}
                  className={`flex items-center gap-2.5 text-sm cursor-pointer select-none ${disabled ? 'opacity-40' : ''}`}
                >
                  <input type="checkbox" className="sr-only peer" checked={checked} disabled={disabled} onChange={() => togglePending(o.value)} />
                  <span className="w-4 h-4 rounded border border-neutral-400 bg-white flex items-center justify-center flex-shrink-0 peer-checked:bg-[#222222] peer-checked:border-[#222222] peer-focus-visible:ring-2 peer-focus-visible:ring-[#222222]/40">
                    {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  {o.color_hex && (
                    <span className="w-3.5 h-3.5 rounded-full border border-black/15 flex-shrink-0" style={{ backgroundColor: o.color_hex }} />
                  )}
                  <span className="text-neutral-700">{o.value} <span className="text-neutral-400">({o.count})</span></span>
                </label>
              )
            })}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => { onApply(openGroup.param, pending); setOpenParam(null) }}
              className="px-6 py-2 rounded-lg border border-[#222222] bg-[#222222] text-white text-xs font-semibold tracking-wider uppercase hover:opacity-90"
            >
              Uygula
            </button>
            {pending.length > 0 && (
              <button
                type="button"
                onClick={() => setPending([])}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-xs text-neutral-600 hover:bg-white"
              >
                Seçimi temizle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

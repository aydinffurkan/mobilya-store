'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateTicketStatus } from '@/lib/actions/support'
import { Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUSES = [
  { value: 'beklemede',   label: 'Beklemede',   color: 'bg-amber-100 text-amber-700' },
  { value: 'inceleniyor', label: 'İnceleniyor', color: 'bg-blue-100 text-blue-700'   },
  { value: 'cozuldu',     label: 'Çözüldü',     color: 'bg-green-100 text-green-700' },
  { value: 'reddedildi',  label: 'Reddedildi',  color: 'bg-red-100 text-red-700'     },
] as const

type Status = typeof STATUSES[number]['value']

export default function TicketStatusForm({
  ticketId,
  currentStatus,
  currentNote,
}: {
  ticketId: string
  currentStatus: Status
  currentNote: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(currentStatus)
  const [note, setNote]     = useState(currentNote)
  const [busy, setBusy]     = useState(false)

  const handleSave = async () => {
    setBusy(true)
    try {
      await updateTicketStatus(ticketId, status, note)
      toast.success('Talep güncellendi')
      router.refresh()
    } catch {
      toast.error('Güncellenemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold text-sm">Durum Güncelle</h2>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
              status === s.value
                ? `${s.color} border-current`
                : 'bg-white text-muted-foreground border-border hover:border-neutral-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Yetkili Notu <span className="text-muted-foreground font-normal">(müşteriye gösterilir)</span></label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Müşteriye iletmek istediğiniz bilgi..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#222222]/40 resize-none bg-background"
        />
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
      >
        {busy ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Check size={13} className="mr-1.5" />}
        Kaydet
      </Button>
    </div>
  )
}

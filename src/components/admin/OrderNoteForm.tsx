'use client'

import { useState } from 'react'
import { Loader2, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { saveOrderNote } from '@/app/admin/siparisler/actions'

export default function OrderNoteForm({ orderId, initialNote }: { orderId: string; initialNote: string | null }) {
  const [note,   setNote]   = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveOrderNote(orderId, note)
      toast.success('Not kaydedildi')
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Sipariş hakkında dahili not ekleyin (müşteriye gösterilmez)..."
        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none bg-background placeholder:text-muted-foreground/60"
      />
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={saving}
        variant="outline"
        className="w-full"
      >
        {saving
          ? <><Loader2 size={13} className="animate-spin mr-1.5" />Kaydediliyor…</>
          : <><StickyNote size={13} className="mr-1.5" />Notu Kaydet</>
        }
      </Button>
    </div>
  )
}
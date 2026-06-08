'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteService } from '@/app/admin/hizmetler/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DeleteServiceButton({ serviceId, serviceTitle }: { serviceId: string; serviceTitle: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`"${serviceTitle}" hizmetini silmek istediğinizden emin misiniz?`)) return
    try {
      await deleteService(serviceId)
      toast.success('Hizmet silindi')
      router.refresh()
    } catch {
      toast.error('Silinemedi')
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
      <Trash2 size={13} />
    </Button>
  )
}

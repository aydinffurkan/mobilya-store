'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) return

    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) {
      toast.error('Ürün silinirken hata oluştu')
    } else {
      toast.success('Ürün silindi')
      router.refresh()
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
      <Trash2 size={14} />
    </Button>
  )
}

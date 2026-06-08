'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteProduct } from '@/app/admin/urunler/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) return

    try {
      await deleteProduct(productId)
      toast.success('Ürün silindi')
      router.refresh()
    } catch {
      toast.error('Ürün silinirken hata oluştu')
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
      <Trash2 size={14} />
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { duplicateProduct } from '@/app/admin/urunler/actions'

interface Props {
  productId: string
  productName: string
}

export default function DuplicateProductButton({ productId, productName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      const { id } = await duplicateProduct(productId)
      toast.success(`"${productName}" kopyalandı`, {
        action: {
          label: 'Düzenle',
          onClick: () => router.push(`/admin/urunler/${id}`),
        },
      })
      router.refresh()
    } catch (e: unknown) {
      toast.error('Kopyalama başarısız: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-[#222222]"
      onClick={handleDuplicate}
      disabled={loading}
      title="Kopyala"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
    </Button>
  )
}
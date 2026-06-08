'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCategory } from '@/app/admin/kategoriler/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DeleteCategoryButton({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) return

    try {
      await deleteCategory(categoryId)
      toast.success('Kategori silindi')
      router.refresh()
    } catch {
      toast.error('Kategori silinirken hata oluştu')
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
      <Trash2 size={14} />
    </Button>
  )
}

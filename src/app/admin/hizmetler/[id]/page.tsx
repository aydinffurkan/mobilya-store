import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ServiceForm from '@/components/admin/ServiceForm'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminClient = createAdminClient()
  const { data } = await adminClient.from('services').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hizmeti Düzenle</h1>
        <p className="text-muted-foreground text-sm mt-1">{data.title}</p>
      </div>
      <ServiceForm service={data} />
    </div>
  )
}

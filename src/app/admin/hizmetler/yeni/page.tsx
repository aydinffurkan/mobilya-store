import ServiceForm from '@/components/admin/ServiceForm'

export default function NewServicePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Yeni Hizmet Ekle</h1>
      </div>
      <ServiceForm />
    </div>
  )
}

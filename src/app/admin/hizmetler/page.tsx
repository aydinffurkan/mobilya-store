import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import DeleteServiceButton from '@/components/admin/DeleteServiceButton'

export default async function AdminServicesPage() {
  const adminClient = createAdminClient()
  const { data: services } = await adminClient
    .from('services')
    .select('*')
    .order('sort_order')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hizmetler</h1>
          <p className="text-muted-foreground text-sm mt-1">Ana sayfada gösterilen hizmet kartları</p>
        </div>
        <Link href="/admin/hizmetler/yeni" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white text-sm font-medium transition-colors">
          <Plus size={16} className="mr-1" /> Yeni Hizmet
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {!services?.length ? (
          <div className="text-center py-16 text-muted-foreground">Henüz hizmet eklenmedi.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">İkon</th>
                <th className="text-left px-4 py-3 font-medium">Başlık</th>
                <th className="text-left px-4 py-3 font-medium">Açıklama</th>
                <th className="text-left px-4 py-3 font-medium">Sıra</th>
                <th className="text-left px-4 py-3 font-medium">Durum</th>
                <th className="text-right px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s: any) => (
                <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-2xl">{s.icon}</td>
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{s.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/hizmetler/${s.id}`} className="text-xs text-[#222222] hover:underline">Düzenle</Link>
                      <DeleteServiceButton serviceId={s.id} serviceTitle={s.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

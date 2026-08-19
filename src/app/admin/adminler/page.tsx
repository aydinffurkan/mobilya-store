import { requireOwnerPage } from '@/lib/supabase/auth-guard'
import { listAdmins } from './actions'
import AdminManager from '@/components/admin/AdminManager'

export const metadata = { title: 'Adminler' }

export default async function AdminlerPage() {
  const owner = await requireOwnerPage()
  const admins = await listAdmins()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Adminler</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Alt admin ekleyip yönetin. Alt adminler admin panelinin tamamına erişir; bu sayfayı yalnızca siz görürsünüz.
        </p>
      </div>
      <AdminManager initialAdmins={admins} ownerId={owner.id} />
    </div>
  )
}

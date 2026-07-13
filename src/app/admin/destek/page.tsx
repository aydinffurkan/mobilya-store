import { getAdminTickets } from '@/lib/actions/support'
import Link from 'next/link'
import { AlertCircle, Wrench, RotateCcw } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  beklemede: 'Beklemede', inceleniyor: 'İnceleniyor',
  cozuldu: 'Çözüldü', reddedildi: 'Reddedildi',
}
const STATUS_COLOR: Record<string, string> = {
  beklemede:   'bg-amber-100 text-amber-700',
  inceleniyor: 'bg-blue-100 text-blue-700',
  cozuldu:     'bg-green-100 text-green-700',
  reddedildi:  'bg-red-100 text-red-700',
}

export default async function AdminDestekPage() {
  const tickets = await getAdminTickets()

  const counts = {
    beklemede:   tickets.filter((t) => t.status === 'beklemede').length,
    inceleniyor: tickets.filter((t) => t.status === 'inceleniyor').length,
    cozuldu:     tickets.filter((t) => t.status === 'cozuldu').length,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Destek Talepleri</h1>
        <p className="text-muted-foreground text-sm mt-1">{tickets.length} talep</p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Beklemede',   value: counts.beklemede,   color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'İnceleniyor', value: counts.inceleniyor, color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Çözüldü',     value: counts.cozuldu,     color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl px-5 py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-16 text-center">
          <AlertCircle size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Henüz destek talebi yok.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Talep</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Müşteri</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Tip</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Durum</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Tarih</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-neutral-800 line-clamp-1">{t.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-neutral-600">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.type === 'iade' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {t.type === 'iade' ? <RotateCcw size={9} /> : <Wrench size={9} />}
                        {t.type === 'iade' ? 'İade' : 'Arıza'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLOR[t.status] ?? ''}`}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/destek/${t.id}`}
                        className="text-xs font-medium text-[#222222] hover:underline"
                      >
                        İncele →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

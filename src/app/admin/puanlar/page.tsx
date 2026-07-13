import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Coins, Users, TrendingUp, Gift, Settings2, History, UserPlus, ChevronRight } from 'lucide-react'
import PointsConfigForm from '@/components/admin/PointsConfigForm'
import ManualPointsForm from '@/components/admin/ManualPointsForm'
import { DEFAULT_POINTS_CONFIG } from '@/lib/points'
import {
  getPointsConfig,
  getUserBalances, getRecentTransactions,
  type UserBalance, type PointTransaction,
} from './actions'

const REASON_LABEL: Record<string, string> = {
  signup:    'Üye Olma',
  review:    'Ürün Yorumu',
  order:     'Sipariş',
  manual:    'Manuel',
  converted: 'Çeki Dönüşüm',
}

const TAB_ITEMS = [
  { key: 'ayarlar',      label: 'Kazanım Kuralları',       icon: Settings2 },
  { key: 'kullanicilar', label: 'Kullanıcı MessaPuanları', icon: Users     },
  { key: 'islemler',     label: 'İşlem Geçmişi',           icon: History   },
  { key: 'manuel',       label: 'Manuel MessaPuan',         icon: UserPlus  },
]

export default async function AdminPuanlarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'ayarlar' } = await searchParams

  const admin = createAdminClient()
  const now   = new Date().toISOString()

  const [config, { data: allRows }] = await Promise.all([
    getPointsConfig().catch(() => DEFAULT_POINTS_CONFIG),
    admin.from('user_points').select('user_id, points, expires_at, reason'),
  ])

  const rows = allRows ?? []

  const totalEarned  = rows.filter((r) => r.points > 0).reduce((s, r) => s + r.points, 0)
  const totalSpent   = Math.abs(rows.filter((r) => r.points < 0).reduce((s, r) => s + r.points, 0))
  const activePoints = rows.reduce((s, r) => {
    if (r.points > 0 && r.expires_at && r.expires_at < now) return s
    return s + r.points
  }, 0)
  const uniqueUsers = new Set(rows.map((r) => r.user_id)).size

  // Tab-specific data
  let userBalances: UserBalance[] = []
  let transactions: PointTransaction[] = []

  if (tab === 'kullanicilar') {
    userBalances = await getUserBalances().catch(() => [])
  }
  if (tab === 'islemler') {
    transactions = await getRecentTransactions(100).catch(() => [])
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Coins size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">MessaPuan</h1>
          <p className="text-muted-foreground text-xs mt-0.5">MessaPuan kurallarını yönetin, kullanıcı puanlarını görüntüleyin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} className="text-green-500" />
            <p className="text-[11px] text-muted-foreground font-medium">Toplam Kazanılan</p>
          </div>
          <p className="text-xl font-bold text-neutral-900">{totalEarned.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-muted-foreground">puan</p>
        </div>
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Gift size={13} className="text-violet-500" />
            <p className="text-[11px] text-muted-foreground font-medium">Çeke Dönüştürülen</p>
          </div>
          <p className="text-xl font-bold text-neutral-900">{totalSpent.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-muted-foreground">puan</p>
        </div>
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Coins size={13} className="text-amber-500" />
            <p className="text-[11px] text-muted-foreground font-medium">Aktif Bakiye</p>
          </div>
          <p className="text-xl font-bold text-neutral-900">{Math.max(0, activePoints).toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-muted-foreground">puan (tüm kullanıcılar)</p>
        </div>
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={13} className="text-blue-500" />
            <p className="text-[11px] text-muted-foreground font-medium">Puan Sahibi</p>
          </div>
          <p className="text-xl font-bold text-neutral-900">{uniqueUsers}</p>
          <p className="text-[11px] text-muted-foreground">kullanıcı</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/60 rounded-xl p-1 mb-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TAB_ITEMS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <Link
              key={t.key}
              href={`/admin/puanlar?tab=${t.key}`}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                active
                  ? 'bg-white shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* ── Ayarlar ──────────────────────────────────────────────────── */}
      {tab === 'ayarlar' && (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">Puan Kuralları</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Her eylem için verilecek puan miktarını ve dönüşüm oranlarını ayarlayın.
            </p>
          </div>
          <PointsConfigForm initialConfig={config} />
        </div>
      )}

      {/* ── Kullanıcı Puanları ────────────────────────────────────────── */}
      {tab === 'kullanicilar' && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Kullanıcı Puanları</h2>
            <span className="text-xs text-muted-foreground">{userBalances.length} kullanıcı</span>
          </div>
          {userBalances.length === 0 ? (
            <div className="py-12 text-center">
              <Coins size={32} className="text-muted-foreground/25 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Henüz puan işlemi yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-border bg-neutral-50">
                    <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Kullanıcı</th>
                    <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Aktif Bakiye</th>
                    <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Toplam Kazanılan</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Son İşlem</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {userBalances.map((u) => (
                    <tr key={u.user_id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-neutral-800">{u.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-sm font-bold ${u.balance > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                          {u.balance.toLocaleString('tr-TR')}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">p</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-neutral-600">{u.total_earned.toLocaleString('tr-TR')}</span>
                        <span className="text-xs text-muted-foreground ml-1">p</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.last_activity).toLocaleDateString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/puanlar?tab=manuel`}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                        >
                          Puan ver <ChevronRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── İşlem Geçmişi ────────────────────────────────────────────── */}
      {tab === 'islemler' && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Son İşlemler</h2>
            <span className="text-xs text-muted-foreground">Son 100 kayıt</span>
          </div>
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <History size={32} className="text-muted-foreground/25 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">İşlem kaydı yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-neutral-50">
                    <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Kullanıcı</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">İşlem</th>
                    <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Puan</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Not</th>
                    <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-neutral-800">{tx.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{tx.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          tx.reason === 'signup'    ? 'bg-blue-100 text-blue-700'   :
                          tx.reason === 'review'    ? 'bg-purple-100 text-purple-700' :
                          tx.reason === 'manual'    ? 'bg-orange-100 text-orange-700' :
                          tx.reason === 'converted' ? 'bg-red-100 text-red-600'      :
                                                      'bg-neutral-100 text-neutral-600'
                        }`}>
                          {REASON_LABEL[tx.reason] ?? tx.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {tx.reference_id ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('tr-TR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Manuel Puan ──────────────────────────────────────────────── */}
      {tab === 'manuel' && (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">Manuel Puan İşlemi</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bir kullanıcıya puan verin veya mevcut puanından düşün.
            </p>
          </div>
          <ManualPointsForm />
        </div>
      )}
    </div>
  )
}

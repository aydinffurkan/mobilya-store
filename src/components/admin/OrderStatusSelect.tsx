'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/app/admin/siparisler/actions'
import { toast } from 'sonner'

const statuses = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
]

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function OrderStatusSelect({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)

  const handleChange = async (newStatus: string) => {
    setSaving(true)
    try {
      await updateOrderStatus(orderId, newStatus)
      setStatus(newStatus)
      toast.success('Sipariş durumu güncellendi')
    } catch {
      toast.error('Durum güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`px-3 py-1.5 rounded-lg border text-sm font-medium focus:outline-none cursor-pointer ${statusColor[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}

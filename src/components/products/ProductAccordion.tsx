'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Product, ProductComponent } from '@/types'

const INSTALLMENTS = [
  { bank: 'Tüm Kartlar',   months: 3,  note: 'Peşin fiyatına'        },
  { bank: 'Tüm Kartlar',   months: 6,  note: 'Peşin fiyatına'        },
  { bank: 'Bonus / Axess', months: 9,  note: '+%1.5 fark'            },
  { bank: 'World / Paraf', months: 12, note: '+%2.5 fark'            },
  { bank: 'Tüm Kartlar',   months: 36, note: 'Alışveriş Kredisi ile' },
]

interface Props {
  product: Product
  componentQuantities: Record<string, number>
  onComponentChange: (id: string, qty: number) => void
  changeRequest: number
}

export default function ProductAccordion({
  product,
  componentQuantities,
  onComponentChange,
  changeRequest,
}: Props) {
  const activeComponents = useMemo(
    () =>
      (product.components ?? [])
        .filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [product.components]
  )

  const hasComponents    = activeComponents.length > 0
  const hasFeaturedSpecs = (product.featured_specs ?? []).length > 0
  const hasSpecs         = (product.specs ?? []).length > 0
  const hasDimensions    = (product.dimensions ?? []).length > 0
  const hasDescription   = !!product.description && !hasSpecs

  const tabs = useMemo(() => {
    const t: { id: string; label: string }[] = []
    if (hasSpecs || hasDescription) t.push({ id: 'ozellikler', label: 'Özellikler' })
    if (hasDimensions)              t.push({ id: 'boyutlar',   label: 'Boyutlar' })
    t.push({ id: 'teslimat', label: 'Teslimat' })
    t.push({ id: 'odeme',    label: 'Ödeme' })
    t.push({ id: 'garanti',  label: 'Garanti' })
    return t
  }, [hasSpecs, hasDescription, hasDimensions])

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'teslimat')
  const componentSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (changeRequest > 0 && hasComponents) {
      setTimeout(() => {
        componentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    }
  }, [changeRequest, hasComponents])

  const handleDecrement = (component: ProductComponent) => {
    const currentQty = componentQuantities[component.id] ?? component.default_quantity
    const newQty = currentQty - 1
    if (newQty < component.min_quantity) return
    const wouldTotal = activeComponents.reduce(
      (sum, c) => sum + (c.id === component.id ? newQty : (componentQuantities[c.id] ?? c.default_quantity)),
      0
    )
    if (wouldTotal <= 0) { toast.error('En az bir parça seçili olmalı'); return }
    onComponentChange(component.id, newQty)
  }

  const handleIncrement = (component: ProductComponent) => {
    const currentQty = componentQuantities[component.id] ?? component.default_quantity
    if (currentQty >= component.max_quantity) return
    onComponentChange(component.id, currentQty + 1)
  }

  const handleAddToSet = (component: ProductComponent) => {
    onComponentChange(component.id, component.default_quantity || 1)
  }

  return (
    <div className="w-full scroll-mt-8">

      {/* ── Öne Çıkan Özellikler ── */}
      {hasFeaturedSpecs && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">
            Öne Çıkan Özellikler
          </p>
          <div className="flex flex-wrap gap-2">
            {product.featured_specs!.map((spec, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#222222] text-white text-[11px] font-medium tracking-wide"
              >
                <Check className="w-3 h-3 flex-shrink-0 stroke-[2.5]" />
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Takım İçeriği ── */}
      {hasComponents && (
        <div ref={componentSectionRef} className="mb-5 border border-neutral-200 rounded-xl overflow-hidden scroll-mt-8">
          <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-700">Takım İçeriği</p>
          </div>
          <div className="px-5 py-4 overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="text-left pb-3 pr-3 w-14">Görsel</th>
                  <th className="text-left pb-3 pr-4">Parçalar</th>
                  <th className="text-right pb-3 px-4 whitespace-nowrap">Birim Fiyat</th>
                  <th className="text-center pb-3 px-4">Adet</th>
                  <th className="text-right pb-3 pl-4 whitespace-nowrap">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {activeComponents.map((component) => {
                  const qty       = componentQuantities[component.id] ?? component.default_quantity
                  const isAdded   = qty > 0
                  const lineTotal = qty * component.unit_price
                  return (
                    <tr key={component.id} className="border-b border-neutral-50 last:border-0">
                      <td className="py-3.5 pr-3">
                        {component.image_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-neutral-100 border border-neutral-200">
                            <Image src={component.image_url} alt={component.name} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 border-dashed" />
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-neutral-700 font-light leading-snug">{component.name}</span>
                      </td>
                      <td className="py-3.5 text-right px-4 text-neutral-500 font-light tabular-nums whitespace-nowrap">
                        {component.unit_price.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-3.5 text-center px-4">
                        {isAdded ? (
                          <div className="flex items-center justify-center">
                            <button type="button" className="w-7 h-7 border border-neutral-200 rounded-l flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-25" onClick={() => handleDecrement(component)} disabled={qty <= component.min_quantity && component.min_quantity === 0}>
                              <Minus size={11} />
                            </button>
                            <span className="w-9 h-7 flex items-center justify-center border-t border-b border-neutral-200 font-medium text-neutral-800">{qty}</span>
                            <button type="button" className="w-7 h-7 border border-neutral-200 rounded-r flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-25" onClick={() => handleIncrement(component)} disabled={qty >= component.max_quantity}>
                              <Plus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => handleAddToSet(component)} className="text-[11px] font-semibold tracking-wider text-[#222222] hover:underline uppercase whitespace-nowrap">
                            + Ekle
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 text-right pl-4 tabular-nums whitespace-nowrap">
                        {isAdded
                          ? <span className="text-neutral-800 font-light">{lineTotal.toLocaleString('tr-TR')} ₺</span>
                          : <span className="text-neutral-300">—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-200">
                  <td colSpan={4} className="pt-3.5 pr-4 text-xs font-semibold text-neutral-700 uppercase tracking-wider">Toplam</td>
                  <td className="pt-3.5 pl-4 text-right text-sm font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                    {activeComponents.reduce((sum, c) => sum + (componentQuantities[c.id] ?? c.default_quantity) * c.unit_price, 0).toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Sekme sistemi ── */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden">

        {/* Tab şeridi */}
        <div className="flex border-b border-neutral-200 bg-neutral-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900 bg-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab içeriği */}
        <div className="bg-white px-5 py-5 min-h-[160px]">

          {/* Özellikler */}
          {activeTab === 'ozellikler' && (
            hasSpecs ? (
              <table className="w-full text-sm">
                <tbody>
                  {product.specs!.map((spec, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-neutral-50/80' : 'bg-white'}>
                      <td className="py-2.5 px-3 font-medium text-neutral-700 w-2/5 align-top text-xs">
                        {spec.key}
                      </td>
                      <td className="py-2.5 px-3 font-light text-neutral-600 align-top text-xs">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm font-light text-neutral-600 leading-relaxed">{product.description}</p>
            )
          )}

          {/* Boyutlar */}
          {activeTab === 'boyutlar' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[300px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left pb-2.5 font-semibold text-neutral-500 uppercase tracking-wider"></th>
                    <th className="text-center pb-2.5 font-semibold text-neutral-500 uppercase tracking-wider">Genişlik</th>
                    <th className="text-center pb-2.5 font-semibold text-neutral-500 uppercase tracking-wider">Derinlik</th>
                    <th className="text-center pb-2.5 font-semibold text-neutral-500 uppercase tracking-wider">Yükseklik</th>
                  </tr>
                </thead>
                <tbody>
                  {product.dimensions!.map((dim, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-neutral-50/80' : 'bg-white'}>
                      <td className="py-2.5 font-semibold text-neutral-700 uppercase tracking-wide">{dim.name}</td>
                      <td className="py-2.5 text-center font-light text-[#222222]">{dim.width}</td>
                      <td className="py-2.5 text-center font-light text-[#222222]">{dim.depth}</td>
                      <td className="py-2.5 text-center font-light text-neutral-500">{dim.height}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Teslimat */}
          {activeTab === 'teslimat' && (
            <p className="text-sm font-light text-neutral-600 leading-relaxed">
              Tüm Türkiye&apos;ye ücretsiz teslimat ve profesyonel ekiplerimiz tarafından ücretsiz kurulum hizmeti sunulmaktadır. Ürünleriniz korunaklı paketlerde kata kadar teslim edilir. Ortalama teslimat süresi 7–14 iş günüdür.
            </p>
          )}

          {/* Ödeme */}
          {activeTab === 'odeme' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                Tüm kredi kartlarına taksit imkânı. Havale/EFT ile ödemelerde <strong className="text-[#222222]">%3 indirim</strong>.
              </p>
              <div className="border border-neutral-100 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-neutral-600">Banka / Kart</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-neutral-600">Taksit</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-neutral-600">Notlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {INSTALLMENTS.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                        <td className="py-2.5 px-3 font-light text-neutral-700">{row.bank}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-neutral-800">{row.months} Ay</td>
                        <td className="py-2.5 px-3 text-right font-light text-neutral-500">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Garanti */}
          {activeTab === 'garanti' && (
            <p className="text-sm font-light text-neutral-600 leading-relaxed">
              İki yıl fabrika garantisi kapsamındadır. Teslim tarihinden itibaren 30 gün içinde, ürün kullanılmamış ve orijinal ambalajında olmak koşuluyla koşulsuz iade hakkınız bulunmaktadır. Tam ücret iadesi yapılır.
            </p>
          )}

        </div>
      </div>
    </div>
  )
}

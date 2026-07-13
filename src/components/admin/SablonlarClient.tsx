'use client'

import { useState } from 'react'
import { VariantTemplate, ComponentTemplate, DimensionTemplate, SpecTemplate, FAQTemplate } from '@/types'
import VariantTemplateManager from '@/components/admin/VariantTemplateManager'
import ComponentTemplateManager from '@/components/admin/ComponentTemplateManager'
import DimensionTemplateManager from '@/components/admin/DimensionTemplateManager'
import SpecTemplateManager from '@/components/admin/SpecTemplateManager'
import FAQTemplateManager from '@/components/admin/FAQTemplateManager'

interface Props {
  variantTemplates: VariantTemplate[]
  componentTemplates: ComponentTemplate[]
  dimensionTemplates: DimensionTemplate[]
  specTemplates: SpecTemplate[]
  faqTemplates: FAQTemplate[]
}

const TABS = [
  { id: 'varyantlar', label: 'Varyantlar'       },
  { id: 'parcalar',   label: 'Parça Seçenekleri' },
  { id: 'olculer',    label: 'Ürün Ölçüleri'     },
  { id: 'ozellikler', label: 'Ürün Özellikleri'  },
  { id: 'sss',        label: 'SSS'               },
] as const

type TabId = typeof TABS[number]['id']

export default function SablonlarClient({
  variantTemplates, componentTemplates, dimensionTemplates, specTemplates, faqTemplates,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('varyantlar')

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-[#222222] text-[#222222]'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'varyantlar'  && <VariantTemplateManager   templates={variantTemplates}   />}
      {activeTab === 'parcalar'    && <ComponentTemplateManager  templates={componentTemplates}  />}
      {activeTab === 'olculer'     && <DimensionTemplateManager  templates={dimensionTemplates}  />}
      {activeTab === 'ozellikler'  && <SpecTemplateManager       templates={specTemplates}       />}
      {activeTab === 'sss'         && <FAQTemplateManager        templates={faqTemplates}        />}
    </div>
  )
}
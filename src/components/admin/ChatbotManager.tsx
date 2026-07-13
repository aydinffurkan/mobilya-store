'use client'

import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initialVisible: boolean
}

export default function ChatbotManager({ initialVisible }: Props) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Yapay Zeka Sohbet Asistanı</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ziyaretçilere Claude AI destekli yüzen sohbet butonu gösterilir. API anahtarının <code className="font-mono bg-muted px-1 rounded">.env.local</code> dosyasında tanımlı olması gerekir.
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="chatbot" initialVisible={initialVisible} />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ProductImageGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-6xl mb-2">🛋️</div>
          <p className="text-sm">Görsel yakında eklenecek</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
        <Image
          src={images[selected]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${i === selected ? 'border-[#8B6914]' : 'border-transparent hover:border-[#8B6914]/40'}`}
            >
              <Image
                src={url}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

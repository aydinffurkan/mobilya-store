export interface ImageAdjustments {
  brightness: number
  contrast: number
  saturation: number
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function bboxSize(w: number, h: number, rotation: number) {
  const r = toRad(rotation)
  return {
    width: Math.abs(Math.cos(r) * w) + Math.abs(Math.sin(r) * h),
    height: Math.abs(Math.sin(r) * w) + Math.abs(Math.cos(r) * h),
  }
}

export async function processImage(
  src: string,
  pixelCrop: Area,
  rotation: number,
  adj: ImageAdjustments,
  quality = 0.92
): Promise<Blob> {
  const image = await createImage(src)
  const { width: bw, height: bh } = bboxSize(image.naturalWidth, image.naturalHeight, rotation)

  const rotCanvas = document.createElement('canvas')
  rotCanvas.width = Math.round(bw)
  rotCanvas.height = Math.round(bh)
  const rotCtx = rotCanvas.getContext('2d')!
  rotCtx.translate(bw / 2, bh / 2)
  rotCtx.rotate(toRad(rotation))
  rotCtx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2)
  rotCtx.drawImage(image, 0, 0)

  const out = document.createElement('canvas')
  out.width = pixelCrop.width
  out.height = pixelCrop.height
  const ctx = out.getContext('2d')!
  ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`
  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      quality
    )
  })
}

export async function fetchAsObjectUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
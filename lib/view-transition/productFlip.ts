const STORAGE_KEY = 'vt-product-flip'

export type ProductFlipRect = {
  left: number
  top: number
  width: number
  height: number
}

export function storeProductFlip(uuid: string, rect: DOMRect) {
  if (typeof sessionStorage === 'undefined') return
  const payload = {
    uuid,
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    } satisfies ProductFlipRect,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function consumeProductFlip(uuid: string): ProductFlipRect | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { uuid?: string; rect?: ProductFlipRect }
    sessionStorage.removeItem(STORAGE_KEY)
    if (parsed.uuid !== uuid || !parsed.rect) return null
    return parsed.rect
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/** Transform iniziale (origine al centro) per morph card → hero. */
export function flipTransformFromRect(from: ProductFlipRect, to: DOMRect) {
  const tw = Math.max(to.width, 1)
  const th = Math.max(to.height, 1)
  const scaleX = from.width / tw
  const scaleY = from.height / th
  const x = from.left + from.width / 2 - (to.left + tw / 2)
  const y = from.top + from.height / 2 - (to.top + th / 2)
  return { x, y, scaleX, scaleY }
}

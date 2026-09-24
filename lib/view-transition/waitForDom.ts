import { internalPathFromHref } from '@/lib/view-transition/navigationPath'

export function waitForAnimationFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count
    const step = () => {
      remaining -= 1
      if (remaining <= 0) resolve()
      else requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

export function navigationDeadlineMs(): number {
  return process.env.NODE_ENV === 'development' ? 8000 : 3500
}

export function pathsEqual(a: string, b: string): boolean {
  const na = internalPathFromHref(a)
  const nb = internalPathFromHref(b)
  return na === nb
}

export function isProductDetailReady(productUuid: string): boolean {
  if (typeof document === 'undefined') return false
  const hero = document.querySelector(
    `[data-vt-product-image="${productUuid}"][data-vt-product-hero]`,
  )
  const section = document.querySelector(
    `[data-product-detail="${productUuid}"]`,
  )
  return Boolean(hero || section)
}

/** Prefisso stabile per `view-transition-name` immagine prodotto (uuid Storyblok). */
export const PRODUCT_IMAGE_VT_PREFIX = 'pimg'

/** Ident CSS-safe (solo hex, niente trattini uuid). */
export function productImageViewTransitionName(uuid: string): string {
  return `${PRODUCT_IMAGE_VT_PREFIX}${uuid.replace(/-/g, '')}`
}

export function isStoryblokVisualEditor(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('_storyblok')
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

export function shouldUseProductImageTransition(): boolean {
  return (
    supportsViewTransitions() &&
    !prefersReducedMotion() &&
    !isStoryblokVisualEditor()
  )
}

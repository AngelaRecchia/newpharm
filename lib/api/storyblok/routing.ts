import { isCatalogContent } from '@/lib/downloadable/parse'

/**
 * Content type che non sono pagine: si fetchano per listing/hub,
 * ma non devono generare una route.
 */
export const NON_ROUTABLE_COMPONENTS = [
  'glossary',
  'insect',
  'downloadable',
] as const

export type NonRoutableComponent = (typeof NON_ROUTABLE_COMPONENTS)[number]

const NON_ROUTABLE_SET = new Set<string>(NON_ROUTABLE_COMPONENTS)

export function isNonRoutableComponent(component: unknown): boolean {
  return typeof component === 'string' && NON_ROUTABLE_SET.has(component)
}

/** Cataloghi (legacy o downloadable kind=catalog): slug pubblico con form, non 307 al PDF. */
export function isDownloadGateContent(content: unknown): boolean {
  return isCatalogContent(content)
}

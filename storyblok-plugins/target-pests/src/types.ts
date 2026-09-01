export type InsectVisibility = 'product' | 'listing' | 'both'

export type InsectOption = {
  uuid: string
  name: string
  visibility: InsectVisibility | null
}

export type TargetPestsPluginItem = {
  uuid: string
  text?: string
}

export type TargetPestsPluginValue = {
  items: TargetPestsPluginItem[]
}

export const EMPTY_VALUE: TargetPestsPluginValue = {
  items: [],
}

export function isProductPestVisible(visibility: InsectVisibility | null): boolean {
  return visibility === null || visibility === 'product' || visibility === 'both'
}

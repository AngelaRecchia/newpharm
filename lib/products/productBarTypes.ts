import type { AssetStoryblok } from '@/types/storyblok'

export const COMPARE_MAX = 2

export type ProductBarItem = {
  uuid: string
  title: string
  image: AssetStoryblok | null
  href?: string
  safetySheetHref?: string
}

export type ActiveProductBar = 'download' | 'compare' | null

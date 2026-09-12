import type { StoryblokAsset } from '@/components/atoms/Asset'

export const COMPARE_MAX = 2

export type ProductBarItem = {
  uuid: string
  title: string
  image: StoryblokAsset | null
  href?: string
  safetySheetHref?: string
}

export type ActiveProductBar = 'download' | 'compare' | null

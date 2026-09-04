import type { StoryblokAsset } from '@/components/atoms/Asset'
import type { ProjectDivision } from '@/lib/projects/divisions'

export const RESOURCE_TABS = ['cataloghi', 'brochure', 'app', 'altro'] as const

export type ResourceTab = (typeof RESOURCE_TABS)[number]

export const RESOURCE_QUERY_PARAM = 'risorse'

export const PAGE_INITIAL = 5
export const PAGE_STEP = 5

export type DownloadPreviewItem = {
  key: string
  kind: ResourceTab
  label: string
  meta?: string
  cover: StoryblokAsset | null
  fileUrl?: string
  href?: string
  modalFileName: string
  shortDescription?: string
  year?: number
  divisions?: ProjectDivision[]
  requireForm?: boolean
}

export type DownloadPreviewGroup = {
  heading?: string
  items: DownloadPreviewItem[]
}

export type AppCardData = {
  key: string
  title: string
  description?: string
  image: StoryblokAsset | null
  iosUrl?: string
  androidUrl?: string
}

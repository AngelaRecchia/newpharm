import type { ListingStoryResolved } from '@/lib/listing/types'
import type { DownloadableKind } from '@/types/storyblok'
import type { StoryblokAsset } from '@/components/atoms/Asset'
import { getLinkUrl, type StoryblokLink } from '@/lib/api/utils/links'
import { getAssetFileUrl, getAssetName, getCoverAsset, toAbsoluteHttpsUrl } from './assets'
import { parseProjectDivisions } from '@/lib/projects/divisions'
import { parseRequireDownloadForm } from './form'
import {
  downloadableKindToTab,
  parseDownloadableKind,
  parseTimestamp,
  parseYear,
} from './parse'
import type { AppCardData, DownloadPreviewItem } from './types'

export function mapCatalogStoryToPreviewItem(
  story: ListingStoryResolved,
  fallbackLabel: string,
): DownloadPreviewItem {
  const content = story.content
  const fileUrl = getAssetFileUrl(content.file)
  const assetName = getAssetName(content.file)
  const title =
    typeof content.title === 'string' && content.title.trim()
      ? content.title.trim()
      : story.name
  const label = title || assetName || fallbackLabel
  const rawDesc = content.short_description
  const shortDescription =
    typeof rawDesc === 'string' && rawDesc.trim().length > 0
      ? rawDesc.trim()
      : undefined

  return {
    key: story.uuid,
    kind: 'cataloghi',
    label,
    cover: getCoverAsset(content.image),
    fileUrl,
    modalFileName: assetName || label,
    shortDescription,
    year: parseYear(
      content.year,
      story.first_published_at ?? story.published_at ?? story.created_at,
    ),
  }
}

export function mapDownloadableStoryToPreviewItem(
  story: ListingStoryResolved,
  fallbackLabel: string,
): DownloadPreviewItem {
  const content = story.content
  const title =
    typeof content.title === 'string' && content.title.trim()
      ? content.title.trim()
      : story.name
  const fileUrl = getAssetFileUrl(content.file)
  const assetName = getAssetName(content.file)
  const rawDesc = content.short_description
  const shortDescription =
    typeof rawDesc === 'string' && rawDesc.trim().length > 0
      ? rawDesc.trim()
      : undefined

  const kind = parseDownloadableKind(content.kind)
  const tab = kind ? downloadableKindToTab(kind) : 'brochure'
  const iosUrl = getLinkUrl(asStoryblokLink(content.ios_url)) ?? undefined
  const androidUrl = getLinkUrl(asStoryblokLink(content.android_url)) ?? undefined

  return {
    key: story.uuid,
    kind: tab,
    label: title || assetName || fallbackLabel,
    cover: getCoverAsset(content.image),
    fileUrl: kind === 'app' ? undefined : fileUrl,
    href: kind === 'app' ? androidUrl || iosUrl : undefined,
    modalFileName: assetName || title || fallbackLabel,
    shortDescription,
    year: parseYear(
      content.year ?? content.date,
      story.first_published_at ?? story.published_at ?? story.created_at,
    ),
    divisions: parseProjectDivisions(content.division),
    requireForm: parseRequireDownloadForm(content.require_download_form),
  }
}

function asStoryblokLink(raw: unknown): StoryblokLink | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as StoryblokLink
}

export function mapDownloadableStoryToAppCard(story: ListingStoryResolved): AppCardData {
  const content = story.content
  const title =
    typeof content.title === 'string' && content.title.trim()
      ? content.title.trim()
      : story.name
  const rawDesc = content.short_description

  return {
    key: story.uuid,
    title,
    description:
      typeof rawDesc === 'string' && rawDesc.trim().length > 0
        ? rawDesc.trim()
        : undefined,
    image: getCoverAsset(content.image),
    iosUrl: getLinkUrl(asStoryblokLink(content.ios_url)) ?? undefined,
    androidUrl: getLinkUrl(asStoryblokLink(content.android_url)) ?? undefined,
  }
}

export function sortStoriesByContentDate(
  stories: ListingStoryResolved[],
): ListingStoryResolved[] {
  return [...stories].sort((a, b) => {
    const aYear = parseYear(
      a.content.year ?? a.content.date,
      a.first_published_at ?? a.published_at ?? a.created_at,
    )
    const bYear = parseYear(
      b.content.year ?? b.content.date,
      b.first_published_at ?? b.published_at ?? b.created_at,
    )
    if (aYear !== bYear) return bYear - aYear
    const aTime = parseTimestamp(a.content.date, [
      a.first_published_at,
      a.published_at,
      a.created_at,
    ])
    const bTime = parseTimestamp(b.content.date, [
      b.first_published_at,
      b.published_at,
      b.created_at,
    ])
    return bTime - aTime
  })
}

export function filterDownloadablesByKind(
  stories: ListingStoryResolved[],
  kind: DownloadableKind,
): ListingStoryResolved[] {
  return stories.filter((story) => parseDownloadableKind(story.content.kind) === kind)
}

export function mergeListingStoriesByUuid(
  ...groups: ListingStoryResolved[][]
): ListingStoryResolved[] {
  const byUuid = new Map<string, ListingStoryResolved>()
  for (const stories of groups) {
    for (const story of stories) {
      byUuid.set(story.uuid, story)
    }
  }
  return [...byUuid.values()]
}

export type DownloadGateData = {
  title: string
  description?: string
  cover: StoryblokAsset | null
  fileUrl: string
  fileName: string
}

export function mapStoryToDownloadGate(
  story: { name: string; content?: Record<string, unknown> | null },
  fallbackLabel: string,
): DownloadGateData | null {
  const content = story.content
  if (!content) return null

  const fileUrlRaw = getAssetFileUrl(content.file)
  if (!fileUrlRaw) return null

  const title =
    typeof content.title === 'string' && content.title.trim()
      ? content.title.trim()
      : story.name || fallbackLabel
  const assetName = getAssetName(content.file)
  const rawDesc = content.short_description
  const description =
    typeof rawDesc === 'string' && rawDesc.trim().length > 0
      ? rawDesc.trim()
      : undefined

  return {
    title,
    description,
    cover: getCoverAsset(content.image),
    fileUrl: toAbsoluteHttpsUrl(fileUrlRaw),
    fileName: assetName || title,
  }
}

import {
  getAssetFileUrl,
  getCoverAsset,
  isPdfFileUrl,
} from '@/lib/downloadable/assets'
import { isCatalogContent } from '@/lib/downloadable/parse'

export type CatalogLikeContent = {
  component?: string | null
  kind?: unknown
  title?: string | null
  file?: unknown
  image?: unknown
  short_description?: string | null
  _uid?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

export function getCatalogBlok(item: unknown): CatalogLikeContent | null {
  if (typeof item === 'string') return null
  const record = asRecord(item)
  if (!record) return null

  if (record.content && typeof record.content === 'object') {
    const content = record.content as CatalogLikeContent
    return isCatalogContent(content) ? content : null
  }

  return isCatalogContent(record) ? (record as CatalogLikeContent) : null
}

export function getCatalogItemKey(item: unknown, content: CatalogLikeContent): string {
  const record = asRecord(item)
  if (typeof record?.uuid === 'string' && record.uuid) return record.uuid
  if (content._uid) return content._uid
  return content.title?.trim() || 'catalog'
}

export function firstCoverAsset(catalog: CatalogLikeContent) {
  return getCoverAsset(catalog.image)
}

function getCatalogFileUrl(catalog: CatalogLikeContent): string | undefined {
  const fileUrl = getAssetFileUrl(catalog.file)
  return isPdfFileUrl(fileUrl) ? fileUrl : undefined
}

function mapToNewpharmUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url.replace('//a.storyblok.com/', '//www.newpharm.it/')
}

export function getCatalogRowMeta(
  catalog: CatalogLikeContent,
  productDownloadFallback: string,
) {
  const fileUrl = getCatalogFileUrl(catalog)
  const rawDescription = catalog.short_description
  const shortDescription =
    typeof rawDescription === 'string' && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : undefined

  const label = catalog.title?.trim() || productDownloadFallback

  return {
    label,
    modalFileName: label,
    fileUrl: mapToNewpharmUrl(fileUrl),
    shortDescription,
  }
}

import { getAssetFileUrl, getAssetName, getCoverAsset } from '@/lib/downloadable/assets'
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

/** Content catalogo: `catalog` legacy oppure `downloadable` con kind catalog. */
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

export function getCatalogFileUrl(catalog: CatalogLikeContent): string | undefined {
  return getAssetFileUrl(catalog.file)
}

/** Replace Storyblok CDN domain with Newpharm domain. */
function mapToNewpharmUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url.replace('//a.storyblok.com/', '//www.newpharm.it/')
}

/** Testo riga + nome file per modale (stesso calcolo ovunque) */
export function getCatalogRowMeta(
  catalog: CatalogLikeContent,
  productDownloadFallback: string,
) {
  const fileUrl = getCatalogFileUrl(catalog)
  const rawDesc = catalog.short_description
  const shortDescription =
    typeof rawDesc === 'string' && rawDesc.trim().length > 0
      ? rawDesc.trim()
      : undefined

  // Usa il titolo del catalogo come nome visualizzato, non il nome file Storyblok
  const label = catalog.title?.trim() || productDownloadFallback
  const modalFileName = label

  return {
    label,
    modalFileName,
    fileUrl: mapToNewpharmUrl(fileUrl),
    shortDescription,
  }
}

import type { CatalogStoryblok, CatalogStoryResolved } from '@/types/storyblok'

export function getCatalogBlok(
  item: CatalogStoryblok | CatalogStoryResolved | string
): CatalogStoryblok | null {
  if (!item || typeof item === 'string') return null
  if (typeof item === 'object' && 'content' in item && item.content) {
    const c = item.content as CatalogStoryblok
    if (c?.component === 'catalog') return c
  }
  const direct = item as CatalogStoryblok
  if (direct?.component === 'catalog') return direct
  return null
}

export function firstCoverAsset(catalog: CatalogStoryblok) {
  const imgs = catalog.image
  if (!Array.isArray(imgs) || imgs.length === 0) return null
  return imgs[0]
}

export function getCatalogFileUrl(catalog: CatalogStoryblok): string | undefined {
  const raw = catalog.file as
    | { filename?: string }
    | { filename?: string }[]
    | null
    | undefined
  if (!raw) return undefined
  const asset = Array.isArray(raw) ? raw[0] : raw
  const filename = asset?.filename
  return typeof filename === 'string' && filename.length > 0 ? filename : undefined
}

type RawFile =
  | { filename?: string; name?: string }
  | { filename?: string; name?: string }[]
  | null
  | undefined

/** Testo riga + nome file per modale (stesso calcolo ovunque) */
export function getCatalogRowMeta(
  catalog: CatalogStoryblok,
  productDownloadFallback: string
) {
  const fileUrl = getCatalogFileUrl(catalog)
  const rawFile = catalog.file as RawFile
  const assetName = Array.isArray(rawFile)
    ? rawFile[0]?.name
    : rawFile?.name
  const label = catalog.title || assetName || productDownloadFallback
  const modalFileName = assetName || label
  const rawDesc = catalog.short_description
  const shortDescription =
    typeof rawDesc === 'string' && rawDesc.trim().length > 0
      ? rawDesc.trim()
      : undefined
  return { label, modalFileName, fileUrl, shortDescription }
}

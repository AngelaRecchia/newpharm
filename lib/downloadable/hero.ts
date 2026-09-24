import type { AssetStoryblok, DownloadableResourcesStoryblok } from '@/types/storyblok'
import type { ResourceTab } from './types'

export function hasHeroAsset(image?: AssetStoryblok[] | null): boolean {
  const first = image?.[0]
  return Boolean(first?.desktop?.filename || first?.mobile?.filename)
}

/** Immagine della categoria attiva, oppure l’immagine di default del blocco. */
export function resolveDownloadableHeroImage(
  blok: Pick<DownloadableResourcesStoryblok, 'image' | 'category_images'>,
  kind: ResourceTab | null,
): AssetStoryblok[] | null | undefined {
  if (kind) {
    const match = blok.category_images?.find(
      (entry) => entry.category === kind && hasHeroAsset(entry.image),
    )
    if (match?.image) return match.image
  }

  return blok.image
}

export function hasAnyDownloadableHeroImage(
  blok: Pick<DownloadableResourcesStoryblok, 'image' | 'category_images'>,
): boolean {
  if (hasHeroAsset(blok.image)) return true
  return (blok.category_images ?? []).some((entry) => hasHeroAsset(entry.image))
}

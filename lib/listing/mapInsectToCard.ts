import type { StoryblokAsset } from '@/components/atoms/Asset'
import { getCoverAsset } from '@/lib/downloadable/assets'
import type { ListingCardData, ListingStoryResolved } from './types'

type InsectContent = {
  title?: string | null
  short_description?: string | null
  image?: StoryblokAsset[] | StoryblokAsset | null
  image_hover?: StoryblokAsset[] | StoryblokAsset | null
  gallery?: StoryblokAsset[] | null
}

function isFilledAsset(value: unknown): value is StoryblokAsset {
  return (
    !!value &&
    typeof value === 'object' &&
    'filename' in value &&
    typeof (value as StoryblokAsset).filename === 'string' &&
    (value as StoryblokAsset).filename.length > 0
  )
}

function asGallery(images: unknown): StoryblokAsset[] {
  if (!Array.isArray(images)) {
    const single = getCoverAsset(images)
    return single && isFilledAsset(single) ? [single] : []
  }
  const collected: StoryblokAsset[] = []
  for (const item of images) {
    const cover = getCoverAsset(item)
    if (cover && isFilledAsset(cover)) collected.push(cover)
  }
  return collected
}

export function mapInsectStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content as InsectContent
  const image = getCoverAsset(content.image)
  const imageHover = getCoverAsset(content.image_hover)
  const gallery = asGallery(content.gallery)

  return {
    uuid: story.uuid,
    title: content.title || story.name,
    description: content.short_description || undefined,
    image,
    imageHover,
    gallery,
  }
}

export function hasInsectGallery(card: ListingCardData): boolean {
  return Boolean(card.gallery?.some((image) => image.filename))
}

export function insectOverlayImages(card: ListingCardData): StoryblokAsset[] {
  // Solo le immagini della gallery: cover e hover del card sono PNG trasparenti
  // e non devono finire nel lightbox (problemi di sfondo).
  if (hasInsectGallery(card) && card.gallery) return card.gallery
  return []
}

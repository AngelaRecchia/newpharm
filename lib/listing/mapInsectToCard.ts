import type { StoryblokAsset } from '@/components/atoms/Asset'
import type { ListingCardData, ListingStoryResolved } from './types'

type InsectContent = {
  title?: string | null
  short_description?: string | null
  image?: StoryblokAsset[] | StoryblokAsset | null
  image_hover?: StoryblokAsset[] | StoryblokAsset | null
  gallery?: StoryblokAsset[] | null
}

function firstImage(images: unknown): StoryblokAsset | null {
  if (Array.isArray(images)) {
    if (images.length === 0) return null
    const first = images[0]
    if (first && typeof first === 'object' && 'filename' in first) {
      return first as StoryblokAsset
    }
    return null
  }

  if (images && typeof images === 'object' && 'filename' in images) {
    return images as unknown as StoryblokAsset
  }

  return null
}

function isFilledAsset(image: unknown): image is StoryblokAsset {
  return (
    !!image &&
    typeof image === 'object' &&
    'filename' in image &&
    typeof (image as StoryblokAsset).filename === 'string' &&
    (image as StoryblokAsset).filename.length > 0
  )
}

function asGallery(images: unknown): StoryblokAsset[] {
  if (!Array.isArray(images)) {
    const single = firstImage(images)
    return single && isFilledAsset(single) ? [single] : []
  }
  return images.filter(isFilledAsset)
}

export function mapInsectStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content as InsectContent
  const image = firstImage(content.image)
  const imageHover = firstImage(content.image_hover)
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
  if (hasInsectGallery(card) && card.gallery) return card.gallery
  return [card.image, card.imageHover ?? null].filter(
    (image): image is StoryblokAsset => image !== null,
  )
}

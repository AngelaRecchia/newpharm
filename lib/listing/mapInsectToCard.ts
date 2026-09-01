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

function asGallery(images: unknown): StoryblokAsset[] {
  if (!Array.isArray(images)) {
    const single = firstImage(images)
    return single ? [single] : []
  }
  return images.filter(
    (image): image is StoryblokAsset =>
      !!image && typeof image === 'object' && 'filename' in image,
  )
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

export function insectOverlayImages(card: ListingCardData): StoryblokAsset[] {
  if (card.gallery && card.gallery.length > 0) return card.gallery
  return [card.image, card.imageHover ?? null].filter(
    (image): image is StoryblokAsset => image !== null,
  )
}

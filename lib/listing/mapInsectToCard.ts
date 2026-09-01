import type { AssetStoryblok } from '@/types/storyblok'
import type { ListingCardData, ListingStoryResolved } from './types'

type InsectContent = {
  title?: string | null
  short_description?: string | null
  image?: AssetStoryblok[] | AssetStoryblok | null
  image_hover?: AssetStoryblok[] | AssetStoryblok | null
  gallery?: AssetStoryblok[] | null
}

function firstImage(images: unknown): AssetStoryblok | null {
  if (Array.isArray(images)) {
    if (images.length === 0) return null
    const first = images[0]
    if (first && typeof first === 'object' && 'filename' in first) {
      return first as AssetStoryblok
    }
    return null
  }

  if (images && typeof images === 'object' && 'filename' in images) {
    return images as unknown as AssetStoryblok
  }

  return null
}

function asGallery(images: unknown): AssetStoryblok[] {
  if (!Array.isArray(images)) {
    const single = firstImage(images)
    return single ? [single] : []
  }
  return images.filter(
    (image): image is AssetStoryblok =>
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

export function insectOverlayImages(card: ListingCardData): AssetStoryblok[] {
  if (card.gallery && card.gallery.length > 0) return card.gallery
  return [card.image, card.imageHover ?? null].filter(
    (image): image is AssetStoryblok => image !== null,
  )
}

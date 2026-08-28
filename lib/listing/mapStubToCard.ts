import type { AssetStoryblok } from '@/types/storyblok'
import type { ListingCardData, ListingStoryResolved } from './types'

type StubContent = {
  title?: string | null
  image?: AssetStoryblok[] | AssetStoryblok | null
  asset?: AssetStoryblok[] | null
  short_description?: string | null
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

export function mapStubStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content as StubContent
  return {
    uuid: story.uuid,
    title: content.title || story.name,
    description: content.short_description || undefined,
    image: firstImage(content.asset ?? content.image),
    href: story.full_slug,
  }
}

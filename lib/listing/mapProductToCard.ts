import type { StoryblokAsset } from '@/components/atoms/Asset'
import type { ProductStoryblok } from '@/types/storyblok'
import type { ListingCardData, ListingStoryResolved } from './types'

function firstImage(images: unknown): StoryblokAsset | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  if (first && typeof first === 'object' && 'filename' in first) {
    return first as StoryblokAsset
  }
  return null
}

export function mapProductStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content as unknown as ProductStoryblok
  const safetySheet = content.safety_data_sheet

  return {
    uuid: story.uuid,
    title: content.title || story.name,
    description: content.short_description || undefined,
    image: firstImage(content.images),
    href: story.full_slug,
    safetySheetHref: safetySheet?.filename || undefined,
  }
}

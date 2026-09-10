import type { StoryblokAsset } from '@/components/atoms/Asset'
import type { ProductStoryblok } from '@/types/storyblok'
import { getCoverAsset } from '@/lib/downloadable/assets'
import type { ListingCardData, ListingStoryResolved } from './types'

export function mapProductStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content as unknown as ProductStoryblok
  const safetySheet = content.safety_data_sheet

  return {
    uuid: story.uuid,
    title: content.title || story.name,
    description: content.short_description || undefined,
    image: getCoverAsset(content.images),
    href: story.full_slug,
    safetySheetHref: safetySheet?.filename || undefined,
  }
}

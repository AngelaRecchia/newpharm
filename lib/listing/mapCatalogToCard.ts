import { getCoverAsset } from '@/lib/downloadable/assets'
import type { ListingCardData, ListingStoryResolved } from './types'

export function mapCatalogStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content
  const rawTitle = content.title
  const rawDesc = content.short_description
  return {
    uuid: story.uuid,
    title:
      typeof rawTitle === 'string' && rawTitle.trim()
        ? rawTitle.trim()
        : story.name,
    description:
      typeof rawDesc === 'string' && rawDesc.trim().length > 0
        ? rawDesc.trim()
        : undefined,
    image: getCoverAsset(content.image),
    href: story.full_slug,
  }
}

import type { StoryblokAsset } from '@/components/atoms/Asset'
import { getCoverAsset } from '@/lib/downloadable/assets'
import type { ListingCardData, ListingStoryResolved } from './types'

type StubContent = {
  title?: string | null
  image?: StoryblokAsset[] | StoryblokAsset | null
  asset?: StoryblokAsset[] | null
  short_description?: string | null
}

export function mapStubStoryToCard(story: ListingStoryResolved): ListingCardData {
  const content = story.content as StubContent
  return {
    uuid: story.uuid,
    title: content.title || story.name,
    description: content.short_description || undefined,
    image: getCoverAsset(content.asset ?? content.image),
    href: story.full_slug,
  }
}

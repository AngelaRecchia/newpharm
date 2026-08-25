import { parseStoryTags, type StoryTag } from '@/lib/stories/tags'
import type { ListingStoryResolved } from '@/lib/listing/types'

export function filterStoriesByTags(
  stories: ListingStoryResolved[],
  selected: StoryTag[],
): ListingStoryResolved[] {
  if (selected.length === 0) return stories

  const selectedSet = new Set(selected)

  return stories.filter((story) => {
    const tags = parseStoryTags(story.content?.tag)
    return tags.some((tag) => selectedSet.has(tag))
  })
}

import type { ListingStoryResolved } from '@/lib/listing/types'
import { parseInsectCategory, type InsectCategory } from './categories'

export function filterInsectsByCategory(
  stories: ListingStoryResolved[],
  selected: InsectCategory[],
): ListingStoryResolved[] {
  if (selected.length === 0) return stories

  const selectedSet = new Set(selected)

  return stories.filter((story) => {
    const category = parseInsectCategory(story.content?.category)
    return category !== null && selectedSet.has(category)
  })
}

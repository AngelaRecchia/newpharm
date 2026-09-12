import { parseProjectDivisions, type ProjectDivision } from '@/lib/projects/divisions'
import type { ListingStoryResolved } from '@/lib/listing/types'

export function filterProjectsByDivisions(
  stories: ListingStoryResolved[],
  selected: ProjectDivision[],
): ListingStoryResolved[] {
  if (selected.length === 0) return stories

  const selectedSet = new Set(selected)

  return stories.filter((story) => {
    const divisions = parseProjectDivisions(story.content?.divisions)
    return divisions.some((division) => selectedSet.has(division))
  })
}

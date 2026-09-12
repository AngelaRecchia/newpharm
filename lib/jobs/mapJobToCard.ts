import { getJobExperienceLabel } from './experience'
import type { ListingStoryResolved } from '@/lib/listing/types'

export type JobCardData = {
  uuid: string
  title: string
  area?: string
  esperienza?: string
  href: string
}

type JobContent = {
  title?: string | null
  area?: string | null
  esperienza?: string | null
}

export function mapJobToCard(story: ListingStoryResolved): JobCardData {
  const content = story.content as JobContent

  return {
    uuid: story.uuid,
    title: content.title || story.name,
    area: content.area || undefined,
    esperienza: getJobExperienceLabel(content.esperienza),
    href: story.full_slug,
  }
}

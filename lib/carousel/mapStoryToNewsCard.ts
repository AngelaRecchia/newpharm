import type { RelatedStory } from '@/lib/api/storyblok/stories'
import type { ListingStoryResolved } from '@/lib/listing/types'
import type { AssetStoryblok } from '@/types/storyblok'

function asAssetArray(value: unknown): AssetStoryblok[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is AssetStoryblok => Boolean(item) && typeof item === 'object')
}

function asDate(value: unknown, fallback?: string | null): string | null {
  if (typeof value === 'string' && value) return value
  return fallback ?? null
}

export function mapStoryToNewsCard(story: ListingStoryResolved): RelatedStory {
  const content = story.content ?? {}
  return {
    full_slug: story.full_slug,
    title: (typeof content.title === 'string' && content.title) || story.name,
    date: asDate(content.date, story.first_published_at ?? story.published_at ?? null),
    tag: (content.tag as RelatedStory['tag']) ?? null,
    asset: asAssetArray(content.asset),
  }
}

export function getStoryTimestamp(story: ListingStoryResolved): number {
  const contentDate = story.content?.date
  if (typeof contentDate === 'string' && contentDate) {
    const parsed = Date.parse(contentDate)
    if (!Number.isNaN(parsed)) return parsed
  }
  const raw = story.first_published_at ?? story.published_at
  return raw ? Date.parse(raw) : 0
}

export function storyHasTag(story: ListingStoryResolved, tag: string): boolean {
  const value = story.content?.tag
  if (Array.isArray(value)) {
    return value.some((item) => item === tag)
  }
  return value === tag
}

export function sortStoriesByDate(stories: ListingStoryResolved[]): ListingStoryResolved[] {
  return [...stories].sort((a, b) => getStoryTimestamp(b) - getStoryTimestamp(a))
}

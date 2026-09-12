import { parseStoryTags, sortStoryTags, type StoryTag } from '@/lib/stories/tags'

export const STORY_TAG_QUERY_PARAM = 'tag'

type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>

export function parseStoryTagSearchParams(
  searchParams: SearchParamsLike,
): StoryTag[] {
  return parseStoryTags(searchParams.get(STORY_TAG_QUERY_PARAM))
}

export function buildStoryTagSearchParams(
  current: SearchParamsLike,
  tags: StoryTag[],
): URLSearchParams {
  const params = new URLSearchParams(current.toString())
  const sorted = sortStoryTags(tags)

  params.delete(STORY_TAG_QUERY_PARAM)
  if (sorted.length > 0) {
    params.set(STORY_TAG_QUERY_PARAM, sorted.join(','))
  }

  return params
}

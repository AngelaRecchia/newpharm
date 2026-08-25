export const STORY_TAGS = [
  'company',
  'r&d',
  'events',
  'people',
  'academy',
  'professional_pest_control',
  'cereals_storage',
  'zootech',
  'home&garden',
] as const

export type StoryTag = (typeof STORY_TAGS)[number]

const TAG_SET = new Set<string>(STORY_TAGS)

export function isStoryTag(value: string): value is StoryTag {
  return TAG_SET.has(value)
}

export function sortStoryTags(values: StoryTag[]): StoryTag[] {
  return STORY_TAGS.filter((tag) => values.includes(tag))
}

export function parseStoryTags(raw: unknown): StoryTag[] {
  const tokens: string[] = []

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim()) {
        tokens.push(item.trim())
      }
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    for (const part of raw.split(',')) {
      const token = part.trim()
      if (token) tokens.push(token)
    }
  }

  return sortStoryTags(tokens.filter(isStoryTag))
}

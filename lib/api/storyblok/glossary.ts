import { cache } from 'react'
import { getStory } from './stories'
import { parseGlossaryItems } from '@/lib/glossary/parse'
import type { GlossaryItem } from '@/lib/glossary/types'

export const getGlossary = cache(
  async (locale: string): Promise<GlossaryItem[]> => {
    const story = await getStory('glossary', locale)
    if (story?.content?.component !== 'glossary') return []
    return parseGlossaryItems(story.content.items)
  },
)

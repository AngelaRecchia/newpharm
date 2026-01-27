'use client'

import { StoryblokComponent, useStoryblok } from '@storyblok/react'
import { useEffect, useState } from 'react'

interface StoryblokRendererProps {
  blok: any
  story?: any // Pass the full story for live editing support
}

/**
 * StoryblokRenderer - Componente Client per renderizzare bloks Storyblok
 * Usa StoryblokComponent per il rendering lato client
 * Usa useStoryblok per abilitare il live editing nel visual editor
 */
export default function StoryblokRenderer({ blok, story }: StoryblokRendererProps) {
  const [content, setContent] = useState(blok)

  // Use useStoryblok to subscribe to live editing changes from the visual editor
  // The hook returns the updated story when changes are made in Storyblok editor
  const liveStory = useStoryblok(
    story?.full_slug || '', 
    { version: 'draft' },
    {
      resolveRelations: '*',
      resolveLinks: 'url',
    }
  )

  // Update content when live story changes (visual editor updates)
  useEffect(() => {
    if (liveStory?.content) {
      setContent(liveStory.content)
    }
  }, [liveStory])

  if (!content || !content.component) {
    return <></>
  }

  return <StoryblokComponent blok={content} />
}

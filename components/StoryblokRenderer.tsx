'use client'

import { StoryblokComponent, useStoryblok } from '@storyblok/react'
import { useEffect, useState } from 'react'

interface StoryblokRendererProps {
  blok: any
  story?: any // Pass the full story for live editing support
}

/**
 * Detect if we're inside the Storyblok Visual Editor (iframe or _storyblok param)
 */
function isInsideStoryblokEditor(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      window.location !== window.parent.location ||
      window.location.search.includes('_storyblok')
    )
  } catch {
    // Cross-origin iframe access throws — assume we're in the editor
    return true
  }
}

/**
 * Inner component mounted ONLY inside the visual editor.
 * Subscribes to live-editing via useStoryblok (triggers API calls).
 */
function LiveEditor({ blok, story }: StoryblokRendererProps) {
  const [content, setContent] = useState(blok)

  const liveStory = useStoryblok(
    story?.full_slug || '',
    { version: 'draft' },
    {
      resolveRelations: '*',
      resolveLinks: 'url',
    }
  )

  useEffect(() => {
    if (liveStory?.content) {
      setContent(liveStory.content)
    }
  }, [liveStory])

  if (!content || !content.component) return null

  return <StoryblokComponent blok={content} />
}

/**
 * StoryblokRenderer
 *
 * During normal development/production: renders statically with zero client-side API calls.
 * Inside the Storyblok visual editor: mounts LiveEditor for real-time updates.
 */
export default function StoryblokRenderer({ blok, story }: StoryblokRendererProps) {
  const [isEditor, setIsEditor] = useState(false)

  useEffect(() => {
    setIsEditor(isInsideStoryblokEditor())
  }, [])

  if (!blok || !blok.component) return null

  if (isEditor) {
    return <LiveEditor blok={blok} story={story} />
  }

  return <StoryblokComponent blok={blok} />
}

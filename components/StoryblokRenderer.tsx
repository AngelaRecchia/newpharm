'use client'

import { StoryblokComponent, useStoryblok } from '@storyblok/react'
import { useEffect, useState } from 'react'

interface StoryblokRendererProps {
  blok: any
  story?: any
}

/**
 * Detect if we're inside the Storyblok Visual Editor (iframe or _storyblok param)
 */
function isInsideStoryblokEditor(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      window.location !== window.parent.location ||
      window.location.search.includes('_storyblok') ||
      window.location.search.includes('_storyblok_tk')
    )
  } catch {
    // Cross-origin iframe access throws — assume we're in the editor
    return true
  }
}

/**
 * StoryblokRenderer
 *
 * During normal development/production: renders statically with zero client-side API calls.
 * Inside the Storyblok visual editor: uses useStoryblok for real-time updates.
 */
export default function StoryblokRenderer({ blok, story }: StoryblokRendererProps) {
  const [isEditor, setIsEditor] = useState(false)

  useEffect(() => {
    setIsEditor(isInsideStoryblokEditor())
  }, [])

  // Calcola lo slug sempre (per evitare problemi con gli hooks)
  const fullSlug = story?.full_slug || (typeof window !== 'undefined'
    ? window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'home'
    : '')

  // Chiama sempre useStoryblok (ma lo usa solo se siamo nell'editor)
  // Passa null come slug se non siamo nell'editor per evitare fetch inutili
  const liveStory = useStoryblok(
    isEditor ? fullSlug : null,
    { version: 'draft' },
    {
      resolveRelations: '*',
      resolveLinks: 'url',
    }
  )

  if (!blok || !blok.component) return null

  // Se siamo nell'editor, usa il contenuto live se disponibile
  const content = isEditor && liveStory?.content ? liveStory.content : blok

  return <StoryblokComponent blok={content} />
}

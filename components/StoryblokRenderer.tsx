'use client'

import { StoryblokComponent, useStoryblok } from '@storyblok/react'
import { useEffect, useState } from 'react'
import { getStoryblokVersion } from '@/lib/api/storyblok/config'
import { STORYBLOK_RESOLVE_RELATIONS } from '@/lib/api/storyblok/resolveRelations'

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

  // Slug CDN: sempre da story (SSR/CSR allineati). Non usare '_' come placeholder:
  // useStoryblok fa comunque GET /v2/cdn/stories/{slug} e 'stories/_' → 404.
  const storySlug = (story?.full_slug || '').trim()

  // Opzioni CDN (2° arg): vanno qui — solo questo oggetto è passato a `api.get('cdn/stories/{slug}', r)`.
  // Il 3° arg serve al bridge live; se `resolve_relations` è solo lì, la prima fetch non risolve le relazioni.
  const cdnParams = {
    version: getStoryblokVersion(),
    resolve_relations: STORYBLOK_RESOLVE_RELATIONS,
    resolve_links: 'url' as const,
  }

  const liveStory = useStoryblok(
    storySlug || '_',
    cdnParams,
    {
      resolveRelations: STORYBLOK_RESOLVE_RELATIONS,
      resolveLinks: 'url',
    }
  )

  if (!blok || !blok.component) return null

  // Se siamo nell'editor, usa il contenuto live se disponibile
  const content = isEditor && liveStory?.content ? liveStory.content : blok

  return <StoryblokComponent blok={content} />
}

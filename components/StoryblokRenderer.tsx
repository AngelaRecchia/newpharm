'use client'

import { StoryblokComponent, useStoryblok } from '@storyblok/react'
import { useEffect, useState } from 'react'
import { getStoryblokVersion } from '@/lib/api/storyblok/config'
import { STORYBLOK_RESOLVE_RELATIONS } from '@/lib/api/storyblok/resolveRelations'

/**
 * Copia `resolved_items` (e altri campi SSR) dal contenuto statico al live editor.
 */
function preserveSsrEnrichment(source: unknown, target: unknown): unknown {
  if (!target || typeof target !== 'object') return target
  if (!source || typeof source !== 'object') return target

  if (Array.isArray(target)) {
    const sourceArr = Array.isArray(source) ? source : []
    return target.map((item, index) => {
      const uid =
        item && typeof item === 'object'
          ? (item as { _uid?: string })._uid
          : undefined
      const byUid =
        uid
          ? sourceArr.find(
              (sourceItem) =>
                sourceItem &&
                typeof sourceItem === 'object' &&
                (sourceItem as { _uid?: string })._uid === uid,
            )
          : undefined
      return preserveSsrEnrichment(byUid ?? sourceArr[index], item)
    })
  }

  const sourceRecord = source as Record<string, unknown>
  const targetRecord = target as Record<string, unknown>
  const merged = { ...targetRecord }

  if (
    typeof merged.component === 'string' &&
    merged.component === sourceRecord.component
  ) {
    if (Array.isArray(sourceRecord.resolved_items)) {
      merged.resolved_items = sourceRecord.resolved_items
    }
    if (Array.isArray(sourceRecord.related_projects)) {
      merged.related_projects = sourceRecord.related_projects
    }
    if (Array.isArray(sourceRecord.related_category_products)) {
      merged.related_category_products = sourceRecord.related_category_products
    }
    if (typeof sourceRecord.related_category_parent_slug === 'string') {
      merged.related_category_parent_slug = sourceRecord.related_category_parent_slug
    }
    if (Array.isArray(sourceRecord.related_stories)) {
      merged.related_stories = sourceRecord.related_stories
    }
  }

  for (const key of Object.keys(merged)) {
    if (
      key === 'resolved_items' ||
      key === 'related_projects' ||
      key === 'related_category_products' ||
      key === 'related_category_parent_slug' ||
      key === 'related_stories'
    ) {
      continue
    }
    if (key in sourceRecord) {
      merged[key] = preserveSsrEnrichment(sourceRecord[key], merged[key])
    }
  }

  return merged
}

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

  // Se siamo nell'editor, usa il contenuto live mantenendo enrichment SSR (resolved_items)
  const content =
    isEditor && liveStory?.content
      ? preserveSsrEnrichment(blok, liveStory.content)
      : blok

  return <StoryblokComponent blok={content} />
}

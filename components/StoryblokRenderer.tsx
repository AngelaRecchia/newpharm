'use client'

import { StoryblokComponent, useStoryblok } from '@storyblok/react'
import { useEffect, useState } from 'react'
import { getStoryblokVersion } from '@/lib/api/storyblok/config'
import { STORYBLOK_RESOLVE_RELATIONS } from '@/lib/api/storyblok/resolveRelations'
import { isInsideStoryblokEditor } from '@/lib/api/storyblok/config'
import { parseCarouselVariant } from '@/lib/carousel/parseCarouselVariant'

function hasSameRelatedProductsConfig(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
): boolean {
  const sourceVariant =
    source.variant && typeof source.variant === 'object'
      ? source.variant
      : { ...source, variant: 'related_products' }
  const targetVariant =
    target.variant && typeof target.variant === 'object'
      ? target.variant
      : { ...target, variant: 'related_products' }
  const sourceConfig = parseCarouselVariant(sourceVariant)
  const targetConfig = parseCarouselVariant(targetVariant)

  return (
    sourceConfig.selection_mode === targetConfig.selection_mode &&
    sourceConfig.items.join(',') === targetConfig.items.join(',') &&
    sourceConfig.vista === targetConfig.vista &&
    sourceConfig.category === targetConfig.category &&
    sourceConfig.subcategory === targetConfig.subcategory &&
    sourceConfig.application_area === targetConfig.application_area &&
    sourceConfig.bestseller === targetConfig.bestseller
  )
}

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
    if (Array.isArray(sourceRecord.resolved_downloadables)) {
      merged.resolved_downloadables = sourceRecord.resolved_downloadables
    }
    if (Array.isArray(sourceRecord.related_projects)) {
      merged.related_projects = sourceRecord.related_projects
    }
    if (sourceRecord.auto_cta_box && typeof sourceRecord.auto_cta_box === 'object') {
      merged.auto_cta_box = sourceRecord.auto_cta_box
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
    if (Array.isArray(sourceRecord.related_news)) {
      merged.related_news = sourceRecord.related_news
    }
    if (Array.isArray(sourceRecord.latest_stories)) {
      merged.latest_stories = sourceRecord.latest_stories
    }
    if (Array.isArray(sourceRecord.resolved_target_pests)) {
      merged.resolved_target_pests = sourceRecord.resolved_target_pests
    }
    // comparison_page_url: iniettata server-side (vedi page.tsx), non esiste
    // nel blok live dell'editor — la ripristiniamo dall'enrichment SSR.
    if (typeof sourceRecord.comparison_page_url === 'string') {
      merged.comparison_page_url = sourceRecord.comparison_page_url
    }
    // product_uuid: stesso pattern — uuid della story richiesto per PDF/confronto.
    if (typeof sourceRecord.product_uuid === 'string') {
      merged.product_uuid = sourceRecord.product_uuid
    }
    // related_products: oggetto plugin; preserva resolved_items SSR dal source
    if (
      sourceRecord.related_products &&
      typeof sourceRecord.related_products === 'object'
    ) {
      const sourceRelatedProducts = sourceRecord.related_products as Record<
        string,
        unknown
      >
      const targetRelatedProducts =
        targetRecord.related_products &&
        typeof targetRecord.related_products === 'object'
          ? (targetRecord.related_products as Record<string, unknown>)
          : {}
      if (Array.isArray(sourceRelatedProducts.resolved_items)) {
        const preserveResolvedItems = hasSameRelatedProductsConfig(
          sourceRelatedProducts,
          targetRelatedProducts,
        )
        merged.related_products = {
          ...targetRelatedProducts,
          resolved_items: preserveResolvedItems
            ? sourceRelatedProducts.resolved_items
            : [],
          variant: targetRelatedProducts.variant ?? sourceRelatedProducts.variant,
        }
      }
    }
  }

  for (const key of Object.keys(merged)) {
    if (
      key === 'resolved_items' ||
      key === 'resolved_downloadables' ||
      key === 'related_projects' ||
      key === 'auto_cta_box' ||
      key === 'related_category_products' ||
      key === 'related_category_parent_slug' ||
      key === 'related_stories' ||
      key === 'related_news' ||
      key === 'latest_stories' ||
      key === 'resolved_target_pests' ||
      key === 'comparison_page_url' ||
      key === 'product_uuid' ||
      key === 'variant' ||
      key === 'listing_items'
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

const STORYBLOK_CDN_PARAMS = {
  version: getStoryblokVersion(),
  resolve_relations: STORYBLOK_RESOLVE_RELATIONS,
  resolve_links: 'url' as const,
}

const STORYBLOK_BRIDGE_PARAMS = {
  resolveRelations: STORYBLOK_RESOLVE_RELATIONS,
  resolveLinks: 'url' as const,
}

function PublishedRenderer({ blok }: { blok: any }) {
  if (!blok || !blok.component) return null

  return <StoryblokComponent blok={blok} />
}

function VisualEditorRenderer({ blok, story }: StoryblokRendererProps) {
  // Slug CDN: sempre da story (SSR/CSR allineati). Non usare '_' come placeholder:
  // useStoryblok fa comunque GET /v2/cdn/stories/{slug} e 'stories/_' → 404.
  const storySlug = (story?.full_slug || '').trim()

  const liveStory = useStoryblok(
    storySlug,
    STORYBLOK_CDN_PARAMS,
    STORYBLOK_BRIDGE_PARAMS,
  )

  if (!blok || !blok.component) return null

  // Usa il contenuto live mantenendo enrichment SSR (resolved_items)
  const content = liveStory?.content
    ? preserveSsrEnrichment(blok, liveStory.content)
    : blok

  return <StoryblokComponent blok={content} />
}

function DraftRenderer({ blok, story }: StoryblokRendererProps) {
  const [isEditor, setIsEditor] = useState(false)

  useEffect(() => {
    setIsEditor(isInsideStoryblokEditor())
  }, [])

  if (!isEditor) {
    if (!blok || !blok.component) return null
    return <StoryblokComponent blok={blok} />
  }

  return <VisualEditorRenderer blok={blok} story={story} />
}

/**
 * StoryblokRenderer
 *
 * In produzione (published): renderizza il contenuto SSR senza alcuna chiamata client-side.
 * In draft: rileva il Visual Editor solo lato client e, solo se necessario, attiva useStoryblok.
 */
export default function StoryblokRenderer({ blok, story }: StoryblokRendererProps) {
  // Decisione SSR-safe: in build published non montiamo mai la logica live.
  if (getStoryblokVersion() === 'published') {
    return <PublishedRenderer blok={blok} />
  }

  return <DraftRenderer blok={blok} story={story} />
}

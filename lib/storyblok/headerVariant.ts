import type {
  AssetStoryblok,
  DownloadableResourcesStoryblok,
  HeroStoryblok,
  PageStoryblok,
} from '@/types/storyblok'
import { hasAnyDownloadableHeroImage } from '@/lib/downloadable/hero'

/** Allineato a DownloadableResources: Hero primary in testa (titolo + almeno un’immagine). */
export function downloadableResourcesHasPrimaryHero(
  blok: Pick<DownloadableResourcesStoryblok, 'title' | 'image' | 'category_images'>,
): boolean {
  const title = typeof blok.title === 'string' ? blok.title.trim() : ''
  return title.length > 0 && hasAnyDownloadableHeroImage(blok)
}

export function getHeaderVariantFromFirstBlock(firstBlock: unknown): 'transparent' | 'white' {
  if (!firstBlock || typeof firstBlock !== 'object') {
    return 'white'
  }

  const block = firstBlock as {
    component?: string
    variant?: string
    title?: string | null
    image?: AssetStoryblok[] | null
  }

  if (block.component === 'hero') {
    const heroBlock = block as HeroStoryblok
    if (heroBlock.variant === 'primary' || heroBlock.variant === 'secondary') {
      return 'transparent'
    }
  }

  if (block.component === 'downloadable_resources') {
    return downloadableResourcesHasPrimaryHero(
      block as DownloadableResourcesStoryblok,
    )
      ? 'transparent'
      : 'white'
  }

  if (
    block.component === 'division_box' ||
    block.component === 'full_banner' ||
    block.component === 'projects'
  ) {
    return 'transparent'
  }

  return 'white'
}

export function getHeaderVariantFromStoryContent(
  content: unknown,
): 'transparent' | 'white' {
  if (!content || typeof content !== 'object') return 'white'

  const storyContent = content as {
    component?: string
    body?: unknown[]
    title?: string | null
    image?: AssetStoryblok[] | null
  }

  if (storyContent.component === 'project') {
    return 'transparent'
  }

  if (storyContent.component === 'downloadable_resources') {
    return downloadableResourcesHasPrimaryHero(
      storyContent as DownloadableResourcesStoryblok,
    )
      ? 'transparent'
      : 'white'
  }

  if (storyContent.component === 'page') {
    const pageContent = storyContent as PageStoryblok
    if (pageContent.body && pageContent.body.length > 0) {
      return getHeaderVariantFromFirstBlock(pageContent.body[0])
    }
  }

  return 'white'
}

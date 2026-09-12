import type {
  AssetStoryblok,
  BoxImageStoryResolved,
  Box_imageStoryblok,
  LinkStoryblok,
} from '@/types/storyblok'
import { getLinkUrl, isEmpty, isLinkEmpty } from '@/lib/api/utils/links'

export type BoxImageClickTarget = 'module' | 'button' | null

export type BoxImageResolvedContent = {
  title: string | null
  subtitle: string | null
  firstAsset: AssetStoryblok | null
  href: string | null
  linkBlok: LinkStoryblok | undefined
  clickTarget: BoxImageClickTarget
}

function isResolvedStory(value: unknown): value is BoxImageStoryResolved {
  if (!value || typeof value !== 'object') return false
  const story = value as Partial<BoxImageStoryResolved>
  return (
    typeof story.full_slug === 'string' &&
    story.full_slug.length > 0 &&
    typeof story.content === 'object' &&
    story.content !== null
  )
}

function firstAssetFrom(images: unknown): AssetStoryblok | null {
  if (Array.isArray(images)) {
    if (images.length === 0) return null
    const first = images[0]
    if (first && typeof first === 'object') {
      return first as AssetStoryblok
    }
    return null
  }

  if (images && typeof images === 'object') {
    return images as AssetStoryblok
  }

  return null
}

function overrideText(
  cms: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  if (!isEmpty(cms)) return cms ?? null
  if (!isEmpty(fallback)) return fallback ?? null
  return null
}

function storyImage(
  kind: 'product' | 'project',
  content: Record<string, unknown>,
): AssetStoryblok | null {
  if (kind === 'product') {
    return firstAssetFrom(content.images)
  }
  return firstAssetFrom(content.image ?? content.asset)
}

function isUsableLinkBlok(linkBlok?: LinkStoryblok | null): linkBlok is LinkStoryblok {
  if (!linkBlok) return false
  return (
    linkBlok.variant === 'black' ||
    linkBlok.variant === 'blue' ||
    !isEmpty(linkBlok.label) ||
    !isLinkEmpty(linkBlok.link)
  )
}

function resolveRef(blok: Box_imageStoryblok): {
  story: BoxImageStoryResolved
  kind: 'product' | 'project'
} | null {
  if (isResolvedStory(blok.product)) {
    return { story: blok.product, kind: 'product' }
  }
  if (isResolvedStory(blok.project)) {
    return { story: blok.project, kind: 'project' }
  }
  return null
}

export function resolveBoxImageContent(
  blok: Box_imageStoryblok,
): BoxImageResolvedContent {
  const rawLink = blok.link?.[0]
  const linkBlok = isUsableLinkBlok(rawLink) ? rawLink : undefined
  const ref = resolveRef(blok)

  if (ref) {
    const content = ref.story.content
    const storyTitle =
      typeof content.title === 'string' && content.title
        ? content.title
        : ref.story.name
    const storySubtitle =
      typeof content.short_description === 'string'
        ? content.short_description
        : null

    return {
      title: overrideText(blok.title, storyTitle),
      subtitle: overrideText(blok.subtitle, storySubtitle),
      firstAsset: firstAssetFrom(blok.asset) ?? storyImage(ref.kind, content),
      href: ref.story.full_slug,
      linkBlok,
      clickTarget: 'module',
    }
  }

  const href = linkBlok ? getLinkUrl(linkBlok.link) : null
  const hasUrl = Boolean(linkBlok && !isLinkEmpty(linkBlok.link) && href)
  const hasLabel = !isEmpty(linkBlok?.label)

  return {
    title: isEmpty(blok.title) ? null : (blok.title ?? null),
    subtitle: isEmpty(blok.subtitle) ? null : (blok.subtitle ?? null),
    firstAsset: firstAssetFrom(blok.asset),
    href: hasUrl ? href : null,
    linkBlok,
    clickTarget: hasUrl ? (hasLabel ? 'button' : 'module') : null,
  }
}

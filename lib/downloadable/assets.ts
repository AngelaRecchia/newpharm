import type { StoryblokAsset } from '@/components/atoms/Asset'

function isAsset(value: unknown): value is StoryblokAsset {
  if (!value || typeof value !== 'object') return false
  return typeof (value as StoryblokAsset).filename === 'string'
}

function fromNestedAssetBlok(value: unknown): StoryblokAsset | null {
  if (!value || typeof value !== 'object') return null
  const blok = value as { component?: string; desktop?: unknown; mobile?: unknown }
  if (blok.component !== 'asset') return null
  if (isAsset(blok.desktop)) return blok.desktop
  if (isAsset(blok.mobile)) return blok.mobile
  return null
}

export function getCoverAsset(raw: unknown): StoryblokAsset | null {
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (isAsset(item)) return item
      const nested = fromNestedAssetBlok(item)
      if (nested) return nested
    }
    return null
  }
  if (isAsset(raw)) return raw
  return fromNestedAssetBlok(raw)
}

export function getAssetFileUrl(raw: unknown): string | undefined {
  const asset = Array.isArray(raw) ? raw.find(isAsset) : isAsset(raw) ? raw : null
  const filename = asset?.filename
  return typeof filename === 'string' && filename.length > 0 ? filename : undefined
}

/** Rende assoluto un URL Storyblok (`//a.storyblok.com/...` → `https://...`). */
export function toAbsoluteHttpsUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}

export function getAssetName(raw: unknown): string | undefined {
  const asset = Array.isArray(raw) ? raw.find(isAsset) : isAsset(raw) ? raw : null
  const name = asset?.name
  return typeof name === 'string' && name.length > 0 ? name : undefined
}

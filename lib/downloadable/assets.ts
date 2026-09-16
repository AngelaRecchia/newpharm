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

export function isPdfFileUrl(url: string | undefined): boolean {
  return Boolean(url && /\.pdf(?:$|[?#])/i.test(url.trim()))
}

/** Rende assoluto un URL Storyblok (`//a.storyblok.com/...` → `https://...`). */
export function toAbsoluteHttpsUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(toAbsoluteHttpsUrl(url)).pathname
    const base = path.split('/').pop()
    if (base && base.length > 0) return decodeURIComponent(base)
  } catch {
    /* ignore */
  }
  return 'download.pdf'
}

function ensureDownloadFileName(fileName: string | undefined, url: string): string {
  const raw = fileName?.trim()
  if (!raw) return fileNameFromUrl(url)
  if (/\.[a-z0-9]{2,8}$/i.test(raw)) return raw
  const fromUrl = fileNameFromUrl(url)
  const ext = fromUrl.includes('.') ? fromUrl.slice(fromUrl.lastIndexOf('.')) : '.pdf'
  return `${raw}${ext}`
}

/** Scarica un file remoto (es. PDF Storyblok) forzando il download, non la navigazione. */
export async function downloadRemoteFile(
  url: string,
  fileName?: string,
): Promise<void> {
  if (typeof document === 'undefined') return
  const absolute = toAbsoluteHttpsUrl(url)
  const name = ensureDownloadFileName(fileName, absolute)

  try {
    const res = await fetch(absolute)
    if (!res.ok) throw new Error(`download failed: ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    const a = document.createElement('a')
    a.href = absolute
    a.download = name
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

export function getAssetName(raw: unknown): string | undefined {
  const asset = Array.isArray(raw) ? raw.find(isAsset) : isAsset(raw) ? raw : null
  const name = asset?.name
  return typeof name === 'string' && name.length > 0 ? name : undefined
}

import type { CatalogsDownloadItemsValue } from '../types'

export function normalizeContent(content: unknown): CatalogsDownloadItemsValue {
  if (!Array.isArray(content)) return []

  const seen = new Set<string>()
  const items: string[] = []
  for (const item of content) {
    if (typeof item !== 'string' || !item || seen.has(item)) continue
    seen.add(item)
    items.push(item)
  }
  return items
}

export function validateContent(content: unknown) {
  return { content: normalizeContent(content) }
}

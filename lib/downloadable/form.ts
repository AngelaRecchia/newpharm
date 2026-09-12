import type { ResourceTab } from './types'

export function parseRequireDownloadForm(raw: unknown): boolean {
  return raw === true || raw === 'true' || raw === 1 || raw === '1'
}

export function requiresDownloadForm(item: {
  kind: ResourceTab
  requireForm?: boolean
}): boolean {
  if (item.kind === 'cataloghi' || item.kind === 'brochure') return true
  if (item.kind === 'app') return false
  return Boolean(item.requireForm)
}

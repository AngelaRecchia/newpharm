import { NextResponse } from 'next/server'
import { getStoryblokVersion } from '@/lib/api/storyblok/config'
import { routing } from '@/i18n/routing'
import type { PluginResolveRequest, PluginResolveResult } from '@/lib/preview/pluginLiveResolve'
import { resolvePluginRequest } from '@/lib/preview/resolvePluginRequest'

const KINDS = new Set(['carousel', 'listing', 'related_products', 'target_pests'])
const MAX_REQUESTS = 20

function isLocale(value: unknown): value is string {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value)
}

function isPluginRequest(value: unknown): value is PluginResolveRequest {
  if (!value || typeof value !== 'object') return false
  const record = value as { id?: unknown; kind?: unknown }
  return typeof record.id === 'string' && record.id.length > 0 && typeof record.kind === 'string' && KINDS.has(record.kind)
}

export async function POST(request: Request) {
  if (getStoryblokVersion() !== 'draft') {
    return NextResponse.json({ results: {} })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 })
  }

  const record = body && typeof body === 'object' ? (body as { locale?: unknown; requests?: unknown }) : {}
  const locale = isLocale(record.locale) ? record.locale : routing.defaultLocale
  const requests = Array.isArray(record.requests) ? record.requests.filter(isPluginRequest) : []

  if (requests.length > MAX_REQUESTS) {
    return NextResponse.json({ error: 'Troppe risoluzioni' }, { status: 400 })
  }

  const results: Record<string, PluginResolveResult> = {}
  await Promise.all(
    requests.map(async (item) => {
      try {
        results[item.id] = await resolvePluginRequest(item, locale)
      } catch (error) {
        console.error('[preview] resolve plugin', item.kind, error)
        results[item.id] =
          item.kind === 'target_pests'
            ? { resolved_target_pests: [] }
            : { resolved_items: [] }
      }
    }),
  )

  return NextResponse.json({ results })
}

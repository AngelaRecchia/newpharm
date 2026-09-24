'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { routing } from '@/i18n/routing'
import {
  applyPluginOverrides,
  collectChangedPluginRequests,
  pluginRequestCacheKey,
  type PluginResolveRequest,
  type PluginResolveResult,
} from '@/lib/preview/pluginLiveResolve'

const DEBOUNCE_MS = 350

export function localeFromFullSlug(fullSlug: unknown): string {
  const first = typeof fullSlug === 'string' ? fullSlug.replace(/^\//, '').split('/')[0] : ''
  if (first && (routing.locales as readonly string[]).includes(first)) return first
  return routing.defaultLocale
}

/**
 * Nel Visual Editor, `useStoryblok` riceve il JSON del field plugin prima del save.
 * I `resolved_*` SSR restano quelli vecchi: qui si ricalcolano solo i plugin cambiati.
 */
export function usePluginLivePreview(
  ssrContent: unknown,
  liveContent: unknown,
  fullSlug: unknown,
): Record<string, PluginResolveResult> {
  const [overrides, setOverrides] = useState<Record<string, PluginResolveResult>>({})
  const cache = useRef(new Map<string, PluginResolveResult>())
  const locale = localeFromFullSlug(fullSlug)

  const requests = useMemo(
    () => (liveContent ? collectChangedPluginRequests(ssrContent, liveContent) : []),
    [ssrContent, liveContent],
  )
  const requestKey = useMemo(
    () => requests.map((request) => `${request.id}:${pluginRequestCacheKey(request)}`).join('\n'),
    [requests],
  )
  const requestsRef = useRef(requests)
  requestsRef.current = requests

  useEffect(() => {
    const current = requestsRef.current
    if (current.length === 0) {
      setOverrides((currentOverrides) =>
        Object.keys(currentOverrides).length === 0 ? currentOverrides : {},
      )
      return
    }

    const pending = current.filter(
      (request) => !cache.current.has(cacheKey(locale, request)),
    )

    if (pending.length === 0) {
      setOverrides(readCached(current, locale, cache.current))
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/preview/resolve-plugins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ locale, requests: pending }),
        })
        if (!response.ok) return
        const data = (await response.json()) as { results?: Record<string, PluginResolveResult> }
        const results = data.results ?? {}
        for (const request of pending) {
          const resolved = results[request.id]
          if (resolved) cache.current.set(cacheKey(locale, request), resolved)
        }
        if (!controller.signal.aborted) {
          setOverrides(readCached(requestsRef.current, locale, cache.current))
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('[preview] field plugin', error)
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [locale, requestKey])

  return overrides
}

function cacheKey(locale: string, request: PluginResolveRequest): string {
  return `${locale}:${pluginRequestCacheKey(request)}`
}

function readCached(
  requests: PluginResolveRequest[],
  locale: string,
  cache: Map<string, PluginResolveResult>,
): Record<string, PluginResolveResult> {
  const next: Record<string, PluginResolveResult> = {}
  for (const request of requests) {
    const hit = cache.get(cacheKey(locale, request))
    if (hit) next[request.id] = hit
  }
  return next
}

export function withPluginOverrides<T>(
  content: T,
  overrides: Record<string, PluginResolveResult>,
): T {
  return applyPluginOverrides(content, overrides)
}

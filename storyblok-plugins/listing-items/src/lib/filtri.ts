import bundledEntries from '../data/filtri-entries.json'
import type { FiltriEntry } from '../types'

const CATEGORIA_PREFIX = '[CATEGORIA] '

export function parseCategories(entries: FiltriEntry[]): FiltriEntry[] {
  return entries.filter((entry) => entry.value.startsWith('category__'))
}

export function getCategoryLabel(entry: FiltriEntry): string {
  return entry.name.startsWith(CATEGORIA_PREFIX)
    ? entry.name.slice(CATEGORIA_PREFIX.length)
    : entry.name
}

export async function fetchFiltriCategories(
  datasourceSlug: string,
  cdnToken: string,
): Promise<FiltriEntry[]> {
  if (!cdnToken) {
    return parseCategories(bundledEntries as FiltriEntry[])
  }

  const entries: FiltriEntry[] = []
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      datasource: datasourceSlug,
      token: cdnToken,
      per_page: '100',
      page: String(page),
    })

    const res = await fetch(
      `https://api.storyblok.com/v2/cdn/datasource_entries/?${params}`,
    )
    if (!res.ok) {
      return parseCategories(bundledEntries as FiltriEntry[])
    }

    const data = (await res.json()) as { datasource_entries?: FiltriEntry[] }
    const batch = data.datasource_entries ?? []
    entries.push(...batch)
    if (batch.length < 100) break
    page++
  }

  const categories = parseCategories(entries)
  return categories.length > 0 ? categories : parseCategories(bundledEntries as FiltriEntry[])
}

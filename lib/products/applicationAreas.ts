import bundled from '@/data/application-areas-entries.json'

export type ApplicationAreaEntry = {
  name: string
  value: string
  id: string
}

export function getApplicationAreaEntries(): ApplicationAreaEntry[] {
  return bundled as ApplicationAreaEntry[]
}

export function getApplicationAreaId(name: string | null): string | undefined {
  if (!name) return undefined
  return getApplicationAreaEntries().find((e) => e.name === name)?.id
}

/**
 * Valori accettati come match per un'area: id, name (slug) e value (label).
 * Copre sia gli id numerici salvati dagli script d'import, sia i value
 * salvati dall'editor Storyblok.
 */
export function getApplicationAreaMatchValues(name: string | null): Set<string> {
  if (!name) return new Set()
  const entry = getApplicationAreaEntries().find((e) => e.name === name)
  if (!entry) return new Set()
  return new Set([entry.id, entry.name, entry.value])
}

export type StorySelectionRef = {
  uuid: string
  group_id?: string | null
}

/**
 * Accetta UUID stringa o oggetti story (`{ uuid }`) — Storyblok a volte
 * materializza i riferimenti e `filter(typeof === 'string')` li scarta.
 */
export function asStoryUuids(value: unknown): string[] {
  if (typeof value === 'string' && value.length > 0) return [value]
  if (!Array.isArray(value)) return []

  const uuids: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.length > 0) {
      uuids.push(item)
      continue
    }
    if (item && typeof item === 'object') {
      const uuid = (item as { uuid?: unknown }).uuid
      if (typeof uuid === 'string' && uuid.length > 0) uuids.push(uuid)
    }
  }
  return uuids
}

function groupIdsOf(
  uuids: string[],
  selectedStories: StorySelectionRef[],
): Set<string> {
  const byUuid = new Map(
    selectedStories.map((story) => [story.uuid, story.group_id ?? null]),
  )
  const groups = new Set<string>()
  for (const uuid of uuids) {
    const group = byUuid.get(uuid)
    if (group) groups.add(group)
  }
  return groups
}

function isSelected(
  story: StorySelectionRef,
  uuids: Set<string>,
  groups: Set<string>,
): boolean {
  if (uuids.has(story.uuid)) return true
  return Boolean(story.group_id && groups.has(story.group_id))
}

/**
 * Include/exclude per UUID e `group_id` (stessa story tradotta in un altro locale).
 * In manuale, se `preserveItemOrder` l'ordine segue `items`.
 */
export function filterStoriesBySelection<T extends StorySelectionRef>(
  localeStories: T[],
  items: string[],
  mode: 'all' | 'manual',
  selectedStories: StorySelectionRef[],
  options?: { preserveItemOrder?: boolean },
): T[] {
  const uuids = new Set(items)
  const groups = groupIdsOf(items, selectedStories)

  if (mode === 'manual') {
    if (items.length === 0) return []

    if (!options?.preserveItemOrder) {
      return localeStories.filter((story) => isSelected(story, uuids, groups))
    }

    const byUuid = new Map(localeStories.map((story) => [story.uuid, story]))
    const byGroup = new Map<string, T>()
    for (const story of localeStories) {
      if (story.group_id && !byGroup.has(story.group_id)) {
        byGroup.set(story.group_id, story)
      }
    }
    const itemGroup = new Map(
      selectedStories.map((story) => [story.uuid, story.group_id ?? null]),
    )
    const seen = new Set<string>()
    const ordered: T[] = []

    for (const uuid of items) {
      const direct = byUuid.get(uuid)
      const viaGroup = itemGroup.get(uuid)
      const match = direct ?? (viaGroup ? byGroup.get(viaGroup) : undefined)
      if (!match || seen.has(match.uuid)) continue
      seen.add(match.uuid)
      ordered.push(match)
    }

    return ordered
  }

  return localeStories.filter((story) => !isSelected(story, uuids, groups))
}

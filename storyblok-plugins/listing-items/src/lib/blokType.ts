export type ListingBlokType = 'editorial' | 'hub' | 'highlight'

function walkForUid(
  node: unknown,
  blockId: string,
): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkForUid(item, blockId)
      if (found) return found
    }
    return null
  }

  const record = node as Record<string, unknown>
  if (record._uid === blockId) return record

  for (const value of Object.values(record)) {
    const found = walkForUid(value, blockId)
    if (found) return found
  }

  return null
}

export function getBlokByUid(
  story: unknown,
  blockUid: string | undefined,
): Record<string, unknown> | null {
  if (!story || !blockUid || typeof story !== 'object') return null

  const storyRecord = story as Record<string, unknown>
  const root = storyRecord.content ?? story
  return walkForUid(root, blockUid)
}

export function getParentBlokComponent(
  story: unknown,
  blockUid: string | undefined,
): string | undefined {
  const blok = getBlokByUid(story, blockUid)
  return typeof blok?.component === 'string' ? blok.component : undefined
}

export function getListingBlokType(
  story: unknown,
  blockUid: string | undefined,
): ListingBlokType | undefined {
  const blok = getBlokByUid(story, blockUid)
  const type = blok?.type

  if (type === 'editorial' || type === 'hub' || type === 'highlight') {
    return type
  }

  return undefined
}

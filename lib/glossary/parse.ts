import type { ISbRichtext } from '@storyblok/react'
import type { GlossaryItem } from './types'

function parseAliases(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function parseGlossaryItems(items: unknown): GlossaryItem[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const blok = raw as Record<string, unknown>
    const uid = typeof blok._uid === 'string' ? blok._uid : ''
    const term = typeof blok.term === 'string' ? blok.term.trim() : ''
    if (!uid || !term) return []

    const definition =
      blok.definition && typeof blok.definition === 'object'
        ? (blok.definition as ISbRichtext)
        : null

    return [
      {
        uid,
        term,
        aliases: parseAliases(blok.aliases),
        definition,
      },
    ]
  })
}

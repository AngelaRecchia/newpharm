import type { GlossaryItem } from './types'

export type GlossaryHit =
  | { type: 'text'; value: string }
  | { type: 'term'; value: string; uid: string }

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildGlossaryMatcher(items: GlossaryItem[]) {
  const phrases: { phrase: string; uid: string }[] = []

  for (const item of items) {
    phrases.push({ phrase: item.term, uid: item.uid })
    for (const alias of item.aliases) {
      phrases.push({ phrase: alias, uid: item.uid })
    }
  }

  const unique = phrases.filter((entry, index, list) => {
    const key = entry.phrase.toLocaleLowerCase()
    return (
      entry.phrase.length > 0 &&
      list.findIndex((other) => other.phrase.toLocaleLowerCase() === key) ===
        index
    )
  })

  unique.sort((a, b) => b.phrase.length - a.phrase.length)

  if (unique.length === 0) return null

  const source = unique.map((entry) => escapeRegExp(entry.phrase)).join('|')
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}_])(${source})(?![\\p{L}\\p{N}_])`,
    'giu',
  )
  const uidByPhrase = new Map(
    unique.map((entry) => [entry.phrase.toLocaleLowerCase(), entry.uid]),
  )

  return (text: string): GlossaryHit[] => {
    if (!text) return []

    const hits: GlossaryHit[] = []
    let lastIndex = 0
    pattern.lastIndex = 0

    for (const match of text.matchAll(pattern)) {
      const value = match[1]
      const index = match.index ?? 0
      if (!value) continue

      if (index > lastIndex) {
        hits.push({ type: 'text', value: text.slice(lastIndex, index) })
      }

      const uid = uidByPhrase.get(value.toLocaleLowerCase())
      if (uid) hits.push({ type: 'term', value, uid })
      else hits.push({ type: 'text', value })

      lastIndex = index + value.length
    }

    if (lastIndex < text.length) {
      hits.push({ type: 'text', value: text.slice(lastIndex) })
    }

    return hits
  }
}

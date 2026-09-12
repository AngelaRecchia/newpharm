import type { GlossaryItem } from './types'

export type GlossaryLetterGroup = {
  letter: string
  items: GlossaryItem[]
}

export function groupGlossaryByLetter(
  items: GlossaryItem[],
  locale: string,
): GlossaryLetterGroup[] {
  const groups = new Map<string, GlossaryItem[]>()
  const sorted = [...items].sort((a, b) =>
    a.term.localeCompare(b.term, locale, { sensitivity: 'base' }),
  )

  for (const item of sorted) {
    const first = [...item.term][0]
    if (!first) continue
    const letter = /\p{L}/u.test(first)
      ? first.toLocaleUpperCase(locale)
      : '#'
    const list = groups.get(letter) ?? []
    list.push(item)
    groups.set(letter, list)
  }

  return [...groups.entries()]
    .sort((a, b) => {
      if (a[0] === '#') return 1
      if (b[0] === '#') return -1
      return a[0].localeCompare(b[0], locale, { sensitivity: 'base' })
    })
    .map(([letter, groupItems]) => ({ letter, items: groupItems }))
}

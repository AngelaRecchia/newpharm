import bundledEntries from '@/data/filtri-entries.json'

/** Populated at build/dev time by scripts/fetch-filtri.ts from Storyblok datasource `filtri`. */
export type FiltriEntry = {
  name: string
  value: string
}

export type ParsedFiltri = {
  categories: FiltriEntry[]
  subfilters: FiltriEntry[]
  bracketByCategory: Map<string, string>
}

const CATEGORIA_PREFIX = '[CATEGORIA] '

export function parseFiltriEntries(entries: FiltriEntry[]): ParsedFiltri {
  const categories: FiltriEntry[] = []
  const subfilters: FiltriEntry[] = []
  const bracketByCategory = new Map<string, string>()

  for (const entry of entries) {
    if (entry.value.startsWith('category__')) {
      categories.push(entry)
      const label = entry.name.startsWith(CATEGORIA_PREFIX)
        ? entry.name.slice(CATEGORIA_PREFIX.length)
        : entry.name
      bracketByCategory.set(entry.value, label.toUpperCase())
    } else {
      subfilters.push(entry)
    }
  }

  return { categories, subfilters, bracketByCategory }
}

export function getSubfilterLabel(name: string): string {
  const match = name.match(/^\[[^\]]+\]\s*(.+)$/)
  return match ? match[1] : name
}

export function getSubfiltersForCategory(
  categoryValue: string,
  parsed: ParsedFiltri,
): FiltriEntry[] {
  const bracket = parsed.bracketByCategory.get(categoryValue)
  if (!bracket) return []

  return parsed.subfilters.filter((entry) => {
    const match = entry.name.match(/^\[([^\]]+)\]/)
    return match?.[1] === bracket
  })
}

export function getCategoryLabel(entry: FiltriEntry): string {
  return entry.name.startsWith(CATEGORIA_PREFIX)
    ? entry.name.slice(CATEGORIA_PREFIX.length)
    : entry.name
}

export function getBundledFiltriEntries(): FiltriEntry[] {
  return bundledEntries as FiltriEntry[]
}

export function getParsedBundledFiltri(): ParsedFiltri {
  return parseFiltriEntries(getBundledFiltriEntries())
}

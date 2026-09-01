export const INSECT_CATEGORIES = [
  'volanti',
  'striscianti',
  'insetti_delle_derrate',
  'rettili_e_anfibi',
  'volatili',
  'roditori',
] as const

export type InsectCategory = (typeof INSECT_CATEGORIES)[number]

const CATEGORY_SET = new Set<string>(INSECT_CATEGORIES)

export function isInsectCategory(value: string): value is InsectCategory {
  return CATEGORY_SET.has(value)
}

export function sortInsectCategories(values: InsectCategory[]): InsectCategory[] {
  return INSECT_CATEGORIES.filter((category) => values.includes(category))
}

export function parseInsectCategories(raw: unknown): InsectCategory[] {
  const tokens: string[] = []

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim()) {
        tokens.push(item.trim())
      }
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    for (const part of raw.split(',')) {
      const token = part.trim()
      if (token) tokens.push(token)
    }
  }

  return sortInsectCategories(tokens.filter(isInsectCategory))
}

export function parseInsectCategory(raw: unknown): InsectCategory | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  return isInsectCategory(raw) ? raw : null
}

import {
  INSECT_CATEGORY_ALIASES,
  INSECT_MACRO_CATEGORIES,
  type InsectCategory,
} from './taxonomy'

export type { InsectCategory }

export const INSECT_CATEGORIES: readonly InsectCategory[] = INSECT_MACRO_CATEGORIES.map(
  (item) => item.value,
)

const CATEGORY_SET = new Set<string>(INSECT_CATEGORIES)

function normalizeCategoryToken(raw: string): InsectCategory | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const aliased = INSECT_CATEGORY_ALIASES[trimmed] ?? trimmed
  return CATEGORY_SET.has(aliased) ? (aliased as InsectCategory) : null
}

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

  const parsed = tokens
    .map(normalizeCategoryToken)
    .filter((value): value is InsectCategory => value !== null)

  return sortInsectCategories([...new Set(parsed)])
}

export function parseInsectCategory(raw: unknown): InsectCategory | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  return normalizeCategoryToken(raw)
}

export function getInsectCategoryLabel(value: InsectCategory): string {
  return INSECT_MACRO_CATEGORIES.find((item) => item.value === value)?.label ?? value
}

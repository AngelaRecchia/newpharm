import { EMPTY_VALUE, type ProductFiltriValue } from '../types'

export function normalizeContent(content: unknown): ProductFiltriValue {
  if (content == null || content === '') {
    return { ...EMPTY_VALUE }
  }

  if (typeof content === 'object' && content !== null && 'category' in content) {
    const value = content as Partial<ProductFiltriValue>
    return {
      category: typeof value.category === 'string' ? value.category : '',
      subcategories: Array.isArray(value.subcategories)
        ? value.subcategories.filter((item): item is string => typeof item === 'string')
        : [],
    }
  }

  return { ...EMPTY_VALUE }
}

export function validateContent(content: unknown) {
  const normalized = normalizeContent(content)
  return { content: normalized }
}

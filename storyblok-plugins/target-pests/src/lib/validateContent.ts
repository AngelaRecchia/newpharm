import { EMPTY_VALUE, type TargetPestsPluginItem, type TargetPestsPluginValue } from '../types'

function asItems(value: unknown): TargetPestsPluginItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as { uuid?: unknown; text?: unknown; insect?: unknown }
    const uuid =
      typeof record.uuid === 'string'
        ? record.uuid
        : typeof record.insect === 'string'
          ? record.insect
          : ''
    if (!uuid) return []
    const text = typeof record.text === 'string' ? record.text.trim() : ''
    return [{ uuid, text: text || undefined }]
  })
}

export function normalizeContent(content: unknown): TargetPestsPluginValue {
  if (content == null || content === '') return { ...EMPTY_VALUE }

  if (typeof content === 'object' && content !== null && 'items' in content) {
    return { items: asItems((content as TargetPestsPluginValue).items) }
  }

  if (Array.isArray(content)) {
    return { items: asItems(content) }
  }

  return { ...EMPTY_VALUE }
}

export function validateContent(content: unknown) {
  return { content: normalizeContent(content) }
}

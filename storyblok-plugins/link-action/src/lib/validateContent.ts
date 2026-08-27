import {
  EMPTY_VALUE,
  LINK_ACTIONS,
  LINK_POPUPS,
  type LinkActionType,
  type LinkActionValue,
  type LinkPopupId,
} from '../types'

function isActionType(value: unknown): value is LinkActionType {
  return typeof value === 'string' && LINK_ACTIONS.includes(value as LinkActionType)
}

function isPopupId(value: unknown): value is LinkPopupId {
  return typeof value === 'string' && LINK_POPUPS.includes(value as LinkPopupId)
}

function readActionType(content: Record<string, unknown>): LinkActionType {
  if (isActionType(content.type)) return content.type
  if (isActionType(content.action)) return content.action
  return 'link'
}

export function contentEquals(a: LinkActionValue, b: LinkActionValue): boolean {
  return a.type === b.type && (a.popup ?? null) === (b.popup ?? null)
}

export function toPluginContent(value: LinkActionValue): LinkActionValue {
  if (value.type === 'popup' && isPopupId(value.popup)) {
    return { type: 'popup', popup: value.popup }
  }
  return { type: value.type }
}

export function normalizeContent(content: unknown): LinkActionValue {
  if (isActionType(content)) {
    return content === 'link' ? EMPTY_VALUE : { type: content }
  }

  if (content == null || content === '' || typeof content !== 'object') {
    return EMPTY_VALUE
  }

  const value = content as Record<string, unknown>
  const type = readActionType(value)
  const popup = type === 'popup' && isPopupId(value.popup) ? value.popup : null
  const normalized: LinkActionValue = popup ? { type, popup } : type === 'link' ? EMPTY_VALUE : { type }

  if (contentEquals(content as LinkActionValue, normalized)) {
    return content as LinkActionValue
  }

  return normalized
}

export function validateContent(content: unknown) {
  return { content: normalizeContent(content) }
}

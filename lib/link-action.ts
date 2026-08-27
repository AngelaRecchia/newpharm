export const LINK_ACTIONS = ['link', 'copy', 'popup'] as const

export type LinkActionType = (typeof LINK_ACTIONS)[number]

export const LINK_POPUPS = ['contattaci', 'job', 'corso'] as const

export type LinkPopupId = (typeof LINK_POPUPS)[number]

export type LinkActionValue = {
  type: LinkActionType
  popup?: LinkPopupId | null
}

export const EMPTY_LINK_ACTION: LinkActionValue = {
  type: 'link',
  popup: null,
}

function isActionType(value: unknown): value is LinkActionType {
  return typeof value === 'string' && LINK_ACTIONS.includes(value as LinkActionType)
}

function isPopupId(value: unknown): value is LinkPopupId {
  return typeof value === 'string' && LINK_POPUPS.includes(value as LinkPopupId)
}

export function parseLinkAction(raw: unknown): LinkActionValue {
  if (isActionType(raw)) return { type: raw, popup: null }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return { ...EMPTY_LINK_ACTION }
    if (trimmed.startsWith('{')) {
      try {
        return parseLinkAction(JSON.parse(trimmed) as unknown)
      } catch {
        return { ...EMPTY_LINK_ACTION }
      }
    }
    return { ...EMPTY_LINK_ACTION }
  }

  if (!raw || typeof raw !== 'object') return { ...EMPTY_LINK_ACTION }

  const value = raw as Partial<LinkActionValue> & { action?: unknown }
  const type = isActionType(value.type)
    ? value.type
    : isActionType(value.action)
      ? value.action
      : 'link'

  return {
    type,
    popup: type === 'popup' && isPopupId(value.popup) ? value.popup : null,
  }
}

export function openPopup(id: LinkPopupId) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('newpharm:popup', { detail: { popup: id } }))
}

export const LINK_ACTIONS = ['link', 'copy', 'popup'] as const

export type LinkActionType = (typeof LINK_ACTIONS)[number]

export const LINK_POPUPS = ['contattaci', 'job', 'corso'] as const

export type LinkPopupId = (typeof LINK_POPUPS)[number]

export type LinkActionValue = {
  type: LinkActionType
  popup?: LinkPopupId | null
}

export const EMPTY_VALUE: LinkActionValue = {
  type: 'link',
  popup: null,
}

export const ACTION_LABELS: Record<LinkActionType, string> = {
  link: 'Link',
  copy: 'Copia',
  popup: 'Popup',
}

export const POPUP_LABELS: Record<LinkPopupId, string> = {
  contattaci: 'Contattaci',
  job: 'Job',
  corso: 'Corso',
}

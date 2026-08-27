import { useEffect, useRef, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import {
  contentEquals,
  toPluginContent,
  validateContent,
} from '../../lib/validateContent'
import {
  ACTION_LABELS,
  EMPTY_VALUE,
  LINK_ACTIONS,
  LINK_POPUPS,
  POPUP_LABELS,
  type LinkActionType,
  type LinkActionValue,
} from '../../types'
import './link-action.css'

const HINTS: Record<LinkActionType, string> = {
  link: 'Usa il campo Link sotto per l’URL di destinazione.',
  copy: 'Da desktop copia il link della pagina; da mobile apre lo share di sistema. Il campo Link viene ignorato.',
  popup: 'Scegli quale popup aprire. Il campo Link viene ignorato.',
}

export function LinkAction() {
  const plugin = useFieldPlugin<LinkActionValue>({
    validateContent,
  })

  const remote = plugin.type === 'loaded' ? plugin.data.content ?? EMPTY_VALUE : EMPTY_VALUE
  const [draft, setDraft] = useState<LinkActionValue | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => {
    const current = draftRef.current
    if (!current) return
    if (contentEquals(current, remote)) setDraft(null)
  }, [remote.type, remote.popup])

  if (plugin.type === 'error') {
    return (
      <p className="link-action__hint">
        Impossibile caricare l’editor. Ricarica la pagina del CMS.
      </p>
    )
  }

  if (plugin.type !== 'loaded') {
    return <p className="link-action__loading">Caricamento editor...</p>
  }

  const value = draft ?? remote

  const setContent = (next: LinkActionValue) => {
    if (contentEquals(next, value)) return
    const payload = toPluginContent(next)
    setDraft(payload)
    void plugin.actions.setContent(payload)
  }

  return (
    <div className="link-action">
      <fieldset className="link-action__fieldset">
        <legend className="link-action__label">Azione</legend>
        {LINK_ACTIONS.map((type) => (
          <label key={type} className="link-action__radio">
            <input
              type="radio"
              name="link-action-type"
              value={type}
              checked={value.type === type}
              onChange={() =>
                setContent({
                  type,
                  popup: type === 'popup' ? value.popup : undefined,
                })
              }
            />
            {ACTION_LABELS[type]}
          </label>
        ))}
      </fieldset>

      {value.type === 'popup' ? (
        <fieldset className="link-action__fieldset">
          <legend className="link-action__label">Popup</legend>
          {LINK_POPUPS.map((popup) => (
            <label key={popup} className="link-action__radio">
              <input
                type="radio"
                name="link-action-popup"
                value={popup}
                checked={value.popup === popup}
                onChange={() => setContent({ type: 'popup', popup })}
              />
              {POPUP_LABELS[popup]}
            </label>
          ))}
        </fieldset>
      ) : null}

      <p className="link-action__hint">{HINTS[value.type]}</p>
    </div>
  )
}

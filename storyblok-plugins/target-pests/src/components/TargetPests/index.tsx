import { useEffect, useMemo, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import { fetchInsectStories, localeFromPluginStory } from '../../lib/stories'
import { validateContent } from '../../lib/validateContent'
import {
  isProductPestVisible,
  type InsectOption,
  type TargetPestsPluginItem,
  type TargetPestsPluginValue,
} from '../../types'
import './target-pests.css'

export function TargetPests() {
  const plugin = useFieldPlugin<TargetPestsPluginValue>({ validateContent })
  const [insects, setInsects] = useState<InsectOption[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = plugin.data?.options ?? {}
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''
  const value = plugin.data?.content ?? { items: [] }
  const locale = localeFromPluginStory(plugin.data?.story)

  const setContent = (next: TargetPestsPluginValue) => {
    plugin.actions?.setContent(next)
  }

  useEffect(() => {
    if (plugin.type !== 'loaded') return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchInsectStories(cdnToken, locale)
      .then((stories) => {
        if (!cancelled) setInsects(stories)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore caricamento insetti')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [plugin.type, cdnToken, locale])

  const selectedUuids = useMemo(
    () => new Set(value.items.map((item) => item.uuid)),
    [value.items],
  )

  const selectable = useMemo(() => {
    const query = search.trim().toLowerCase()
    return insects.filter((insect) => {
      if (!isProductPestVisible(insect.visibility)) return false
      if (selectedUuids.has(insect.uuid)) return false
      if (!query) return true
      return insect.name.toLowerCase().includes(query)
    })
  }, [insects, search, selectedUuids])

  const insectsByUuid = useMemo(
    () => new Map(insects.map((insect) => [insect.uuid, insect])),
    [insects],
  )

  const addItem = (insect: InsectOption) => {
    setContent({
      items: [...value.items, { uuid: insect.uuid }],
    })
    setSearch('')
  }

  const updateText = (uuid: string, text: string) => {
    setContent({
      items: value.items.map((item) =>
        item.uuid === uuid ? { ...item, text: text.trim() || undefined } : item,
      ),
    })
  }

  const removeItem = (uuid: string) => {
    setContent({
      items: value.items.filter((item) => item.uuid !== uuid),
    })
  }

  const moveItem = (uuid: string, direction: -1 | 1) => {
    const index = value.items.findIndex((item) => item.uuid === uuid)
    const next = index + direction
    if (index < 0 || next < 0 || next >= value.items.length) return
    const items = [...value.items]
    const [moved] = items.splice(index, 1)
    items.splice(next, 0, moved)
    setContent({ items })
  }

  if (plugin.type !== 'loaded') {
    return <p className="target-pests__loading">Caricamento editor...</p>
  }

  if (!cdnToken) {
    return (
      <p className="target-pests__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  return (
    <div className="target-pests">
      {value.items.length > 0 ? (
        <ul className="target-pests__selected">
          {value.items.map((item: TargetPestsPluginItem, index: number) => {
            const insect = insectsByUuid.get(item.uuid)
            return (
              <li key={item.uuid} className="target-pests__row">
                <div className="target-pests__row-head">
                  <strong>{insect?.name || item.uuid}</strong>
                  <div className="target-pests__actions">
                    <button
                      type="button"
                      className="target-pests__icon"
                      disabled={index === 0}
                      onClick={() => moveItem(item.uuid, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="target-pests__icon"
                      disabled={index === value.items.length - 1}
                      onClick={() => moveItem(item.uuid, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="target-pests__remove"
                      onClick={() => removeItem(item.uuid)}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
                <textarea
                  className="target-pests__textarea"
                  rows={2}
                  placeholder="Testo opzionale per questo prodotto"
                  value={item.text ?? ''}
                  onChange={(event) => updateText(item.uuid, event.target.value)}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="target-pests__hint">Nessun infestante selezionato.</p>
      )}

      <div className="target-pests__field">
        <label className="target-pests__label" htmlFor="target-pests-search">
          Aggiungi infestante
        </label>
        <input
          id="target-pests-search"
          className="target-pests__input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca insetto..."
        />
      </div>

      {loading && <p className="target-pests__loading">Caricamento insetti...</p>}
      {error && <p className="target-pests__error">{error}</p>}

      {selectable.length > 0 && (
        <div className="target-pests__results">
          {selectable.map((insect) => (
            <button
              key={insect.uuid}
              type="button"
              className="target-pests__result"
              onClick={() => addItem(insect)}
            >
              {insect.name}
            </button>
          ))}
        </div>
      )}

      {!loading && insects.length > 0 && selectable.length === 0 && (
        <p className="target-pests__hint">
          Nessun insetto infestante disponibile da aggiungere.
        </p>
      )}
    </div>
  )
}

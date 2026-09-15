import { useEffect, useMemo, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import { fetchPdfCatalogs, localeFromPluginStory } from '../../lib/stories'
import { validateContent } from '../../lib/validateContent'
import type { CatalogOption, CatalogsDownloadItemsValue } from '../../types'
import './catalogs-download-items.css'

export function CatalogsDownloadItems() {
  const plugin = useFieldPlugin<CatalogsDownloadItemsValue>({ validateContent })
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token =
    plugin.data?.options?.cdn_token ||
    import.meta.env.VITE_STORYBLOK_CDN_TOKEN ||
    ''
  const value = plugin.data?.content ?? []
  const locale = localeFromPluginStory(plugin.data?.story)

  useEffect(() => {
    if (plugin.type !== 'loaded' || !token) return

    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPdfCatalogs(token, locale)
      .then((items) => {
        if (!cancelled) setCatalogs(items)
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : 'Errore nel caricamento dei cataloghi',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locale, plugin.type, token])

  const catalogsByUuid = useMemo(
    () => new Map(catalogs.map((catalog) => [catalog.uuid, catalog])),
    [catalogs],
  )
  const selected = useMemo(() => new Set(value), [value])
  const selectable = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalogs.filter((catalog) => {
      if (selected.has(catalog.uuid)) return false
      return !query || catalog.name.toLowerCase().includes(query)
    })
  }, [catalogs, search, selected])

  const setContent = (items: string[]) => {
    plugin.actions?.setContent(items)
  }

  if (plugin.type !== 'loaded') {
    return <p className="catalogs-download-items__status">Caricamento editor...</p>
  }

  if (!token) {
    return (
      <p className="catalogs-download-items__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  return (
    <div className="catalogs-download-items">
      <p className="catalogs-download-items__hint">
        Sono selezionabili solo cataloghi e downloadables di tipo Catalogo o Brochure con PDF allegato.
      </p>
      {value.length > 0 ? (
        <ol className="catalogs-download-items__selected">
          {value.map((uuid, index) => {
            const catalog = catalogsByUuid.get(uuid)
            return (
              <li key={uuid} className="catalogs-download-items__row">
                <span>
                  <strong>{catalog?.name ?? uuid}</strong>
                  {catalog ? (
                    <small>{catalog.fileName}</small>
                  ) : (
                    <small className="catalogs-download-items__warning">
                      Riferimento esistente non verificabile nella lingua corrente: viene mantenuto.
                    </small>
                  )}
                </span>
                <span className="catalogs-download-items__actions">
                  <button
                    type="button"
                    aria-label="Sposta su"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...value]
                      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                      setContent(next)
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Sposta giù"
                    disabled={index === value.length - 1}
                    onClick={() => {
                      const next = [...value]
                      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                      setContent(next)
                    }}
                  >
                    ↓
                  </button>
                  <button type="button" onClick={() => setContent(value.filter((item) => item !== uuid))}>
                    Rimuovi
                  </button>
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="catalogs-download-items__status">Nessun catalogo selezionato.</p>
      )}

      <label className="catalogs-download-items__label" htmlFor="catalogs-download-items-search">
        Aggiungi catalogo o brochure PDF
      </label>
      <input
        id="catalogs-download-items-search"
        className="catalogs-download-items__input"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cerca catalogo o brochure..."
      />
      {loading ? <p className="catalogs-download-items__status">Caricamento cataloghi...</p> : null}
      {error ? <p className="catalogs-download-items__error">{error}</p> : null}
      {!loading && !error && selectable.length > 0 ? (
        <div className="catalogs-download-items__results">
          {selectable.map((catalog) => (
            <button
              key={catalog.uuid}
              type="button"
              className="catalogs-download-items__result"
              onClick={() => {
                setContent([...value, catalog.uuid])
                setSearch('')
              }}
            >
              <strong>{catalog.name}</strong>
              <small>{catalog.fileName}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import { fetchFiltriCategories, getCategoryLabel } from '../../lib/filtri'
import { getVariantLabel, searchStories, sortStoryOptions } from '../../lib/stories'
import { validateContent } from '../../lib/validateContent'
import type { FiltriEntry, ListingVariantSlug, ListingVariantValue, StoryOption } from '../../types'
import './listing-items.css'

const VARIANTS: ListingVariantSlug[] = ['prodotto', 'progetto', 'insetto', 'catalogo']

const DEFAULT_VALUE: ListingVariantValue = {
  variant: 'prodotto',
  items: [],
  category: '',
  piu_recente: false,
  alfabetico: false,
}

function isDummyVariant(variant: ListingVariantSlug): boolean {
  return variant === 'progetto' || variant === 'insetto'
}

function supportsSortOptions(variant: ListingVariantSlug): boolean {
  return variant === 'prodotto' || variant === 'catalogo'
}

export function ListingItems() {
  const plugin = useFieldPlugin<ListingVariantValue>({ validateContent })
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<StoryOption[]>([])
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<FiltriEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = plugin.data?.options ?? {}
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''
  const datasourceSlug = options.datasource_slug || 'filtri'
  const value = plugin.data?.content ?? DEFAULT_VALUE

  const setContent = useCallback(
    (next: ListingVariantValue) => {
      plugin.actions?.setContent(next)
    },
    [plugin.actions],
  )

  const handleVariantChange = (variant: ListingVariantSlug) => {
    if (variant === value.variant) return
    if (value.items.length > 0) {
      const confirmed = window.confirm(
        'Cambiando variante verranno rimossi gli elementi selezionati. Continuare?',
      )
      if (!confirmed) return
    }
    setContent({
      variant,
      items: [],
      category: '',
      piu_recente: false,
      alfabetico: false,
    })
    setLabels({})
    setResults([])
    setSearch('')
  }

  const updateOptions = (patch: Partial<ListingVariantValue>) => {
    setContent({ ...value, ...patch })
  }

  const toggleItem = (story: StoryOption) => {
    const selected = new Set(value.items)
    if (selected.has(story.uuid)) {
      selected.delete(story.uuid)
    } else {
      selected.add(story.uuid)
    }
    setLabels((prev) => ({ ...prev, [story.uuid]: story.name }))
    setContent({ ...value, items: [...selected] })
  }

  const removeItem = (uuid: string) => {
    setContent({ ...value, items: value.items.filter((id) => id !== uuid) })
  }

  useEffect(() => {
    if (plugin.type !== 'loaded' || value.variant !== 'prodotto') return

    let cancelled = false
    fetchFiltriCategories(datasourceSlug, cdnToken)
      .then((cats) => {
        if (!cancelled) setCategories(cats)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [plugin.type, value.variant, datasourceSlug, cdnToken])

  useEffect(() => {
    if (plugin.type !== 'loaded') return

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const searchOptions = isDummyVariant(value.variant)
          ? {}
          : {
              category: value.category,
              piu_recente: value.piu_recente,
              alfabetico: value.alfabetico,
            }
        const stories = await searchStories(
          value.variant,
          cdnToken,
          search,
          searchOptions,
        )
        if (!cancelled) {
          setResults(
            isDummyVariant(value.variant)
              ? stories
              : sortStoryOptions(stories, {
                  piu_recente: value.piu_recente,
                  alfabetico: value.alfabetico,
                }),
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore ricerca stories')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [
    plugin.type,
    value.variant,
    value.category,
    value.piu_recente,
    value.alfabetico,
    cdnToken,
    search,
  ])

  const selectedItems = useMemo(
    () =>
      value.items.map((uuid) => ({
        uuid,
        name: labels[uuid] ?? uuid.slice(0, 8),
      })),
    [value.items, labels],
  )

  if (plugin.type !== 'loaded') {
    return <p className="listing-items__loading">Caricamento editor...</p>
  }

  if (!cdnToken) {
    return (
      <p className="listing-items__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  return (
    <div className="listing-items">
      <div className="listing-items__field">
        <label className="listing-items__label" htmlFor="listing-variant">
          Variant
        </label>
        <select
          id="listing-variant"
          className="listing-items__select"
          value={value.variant}
          onChange={(e) => handleVariantChange(e.target.value as ListingVariantSlug)}
        >
          {VARIANTS.map((variant) => (
            <option key={variant} value={variant}>
              {getVariantLabel(variant)}
            </option>
          ))}
        </select>
      </div>

      {value.variant === 'prodotto' && (
        <div className="listing-items__options">
          <div className="listing-items__field">
            <label className="listing-items__label" htmlFor="listing-category">
              Categoria
            </label>
            <select
              id="listing-category"
              className="listing-items__select"
              value={value.category ?? ''}
              onChange={(e) => updateOptions({ category: e.target.value })}
            >
              <option value="">Tutte le categorie</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <label className="listing-items__checkbox">
            <input
              type="checkbox"
              checked={Boolean(value.piu_recente)}
              onChange={(e) =>
                updateOptions({
                  piu_recente: e.target.checked,
                  alfabetico: e.target.checked ? false : value.alfabetico,
                })
              }
            />
            Più recente
          </label>

          <label className="listing-items__checkbox">
            <input
              type="checkbox"
              checked={Boolean(value.alfabetico)}
              onChange={(e) =>
                updateOptions({
                  alfabetico: e.target.checked,
                  piu_recente: e.target.checked ? false : value.piu_recente,
                })
              }
            />
            Alfabetico
          </label>
        </div>
      )}

      {value.variant === 'catalogo' && (
        <div className="listing-items__options">
          <label className="listing-items__checkbox">
            <input
              type="checkbox"
              checked={Boolean(value.piu_recente)}
              onChange={(e) =>
                updateOptions({
                  piu_recente: e.target.checked,
                  alfabetico: e.target.checked ? false : value.alfabetico,
                })
              }
            />
            Più recente
          </label>

          <label className="listing-items__checkbox">
            <input
              type="checkbox"
              checked={Boolean(value.alfabetico)}
              onChange={(e) =>
                updateOptions({
                  alfabetico: e.target.checked,
                  piu_recente: e.target.checked ? false : value.piu_recente,
                })
              }
            />
            Alfabetico
          </label>
        </div>
      )}

      {isDummyVariant(value.variant) && (
        <p className="listing-items__dummy">
          Opzioni di filtro per {getVariantLabel(value.variant).toLowerCase()} in arrivo.
        </p>
      )}

      <div className="listing-items__field">
        <label className="listing-items__label" htmlFor="listing-search">
          Cerca {getVariantLabel(value.variant).toLowerCase()}
          {value.variant === 'prodotto' && value.category
            ? ` (${getCategoryLabel(
                categories.find((c) => c.value === value.category) ?? {
                  name: value.category,
                  value: value.category,
                },
              )})`
            : ''}
        </label>
        <input
          id="listing-search"
          className="listing-items__input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome story..."
        />
      </div>

      {loading && <p className="listing-items__loading">Ricerca in corso...</p>}
      {error && <p className="listing-items__error">{error}</p>}

      {results.length > 0 && (
        <div className="listing-items__results">
          {results.map((story) => {
            const isSelected = value.items.includes(story.uuid)
            return (
              <button
                key={story.uuid}
                type="button"
                className="listing-items__result"
                disabled={isSelected}
                onClick={() => toggleItem(story)}
              >
                {story.name}
              </button>
            )
          })}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="listing-items__field">
          <span className="listing-items__label">Selezionati ({selectedItems.length})</span>
          <div className="listing-items__selected">
            {selectedItems.map((item) => (
              <div key={item.uuid} className="listing-items__selected-item">
                <span>{item.name}</span>
                <button
                  type="button"
                  className="listing-items__remove"
                  onClick={() => removeItem(item.uuid)}
                >
                  Rimuovi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isDummyVariant(value.variant) && (
        <p className="listing-items__hint">
          {value.variant === 'prodotto' && value.category
            ? 'Mostra solo prodotti della categoria selezionata.'
            : `Seleziona le story di tipo ${getVariantLabel(value.variant).toLowerCase()}.`}
          {supportsSortOptions(value.variant) &&
            (value.piu_recente || value.alfabetico) &&
            ` Ordinamento: ${value.piu_recente ? 'più recente' : 'alfabetico'}.`}
        </p>
      )}
    </div>
  )
}

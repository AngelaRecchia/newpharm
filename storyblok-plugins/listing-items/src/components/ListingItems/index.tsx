import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import applicationAreas from '../../data/application-areas-entries.json'
import {
  fetchAllFiltriEntries,
  fetchFiltriCategories,
  getCategoryLabel,
  getSubfilterLabel,
  getSubfiltersForCategory,
} from '../../lib/filtri'
import { getVariantLabel, searchStories, sortStoryOptions } from '../../lib/stories'
import { getListingBlokType, getParentBlokComponent } from '../../lib/blokType'
import { validateContent } from '../../lib/validateContent'
import { CarouselItems } from '../CarouselItems'
import { ProjectsHighlightItems } from '../ProjectsHighlightItems'
import type {
  ApplicationAreaEntry,
  FiltriEntry,
  ListingImageRatio,
  ListingProductVista,
  ListingVariantSlug,
  PluginVariantSlug,
  PluginVariantValue,
  ProjectDivision,
  StoryOption,
} from '../../types'
import {
  PROJECT_DIVISION_LABELS,
  PROJECT_DIVISIONS,
} from '../../types'
import './listing-items.css'

const VARIANTS: ListingVariantSlug[] = ['prodotto', 'catalogo', 'progetto']

const IMAGE_RATIOS: { value: ListingImageRatio; label: string }[] = [
  { value: 'portrait', label: 'Rettangolare' },
  { value: 'square', label: 'Quadrata' },
]

const VISTAS: { value: ListingProductVista; label: string }[] = [
  { value: 'categoria', label: 'Categoria' },
  { value: 'application_area', label: 'Application area' },
]

const DEFAULT_PRODOTTO: PluginVariantValue = {
  variant: 'prodotto',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  items: [],
  image_ratio: 'portrait',
}

const DEFAULT_REF: PluginVariantValue = {
  variant: 'catalogo',
  selection_mode: 'all',
  tag: '',
  items: [],
  image_ratio: 'portrait',
}

function isProdotto(variant: PluginVariantSlug): boolean {
  return variant === 'prodotto'
}

function isRefAllMode(value: PluginVariantValue): boolean {
  return !isProdotto(value.variant) && value.selection_mode === 'all'
}

function isStorySelected(value: PluginVariantValue, uuid: string): boolean {
  const items = Array.isArray(value.items) ? value.items : []
  if (isProdotto(value.variant)) {
    return value.selection_mode === 'manual' && items.includes(uuid)
  }
  if (value.selection_mode === 'manual') {
    return items.includes(uuid)
  }
  return !items.includes(uuid)
}

export function ListingItems() {
  const plugin = useFieldPlugin<PluginVariantValue>({ validateContent })
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<StoryOption[]>([])
  const [categories, setCategories] = useState<FiltriEntry[]>([])
  const [filtriEntries, setFiltriEntries] = useState<FiltriEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = plugin.data?.options ?? {}
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''
  const datasourceSlug = options.datasource_slug || 'filtri'
  const value = plugin.data?.content ?? DEFAULT_PRODOTTO
  const listingType = getListingBlokType(plugin.data?.story, plugin.data?.blockUid)
  const parentComponent = getParentBlokComponent(plugin.data?.story, plugin.data?.blockUid)
  const isCarousel =
    parentComponent === 'carousel' || options.context === 'carousel'
  const isProjectsHighlight =
    parentComponent === 'projects_highlight' ||
    options.context === 'projects_highlight' ||
    value.context === 'projects_highlight'
  const isEditorial = listingType === 'editorial'
  const variantOptions =
    value.variant === 'insetto' ? [...VARIANTS, 'insetto' as const] : VARIANTS

  const applicationAreaOptions = applicationAreas as ApplicationAreaEntry[]

  const setContent = useCallback(
    (next: PluginVariantValue) => {
      const serialized = JSON.stringify(next)
      if (serialized === JSON.stringify(value)) return
      plugin.actions?.setContent(next)
    },
    [plugin.actions, value],
  )

  const updateOptions = (patch: Partial<PluginVariantValue>) => {
    setContent({ ...value, ...patch })
  }

  const handleVariantChange = (variant: ListingVariantSlug) => {
    if (variant === value.variant) return
    if ((value.items?.length ?? 0) > 0) {
      const confirmed = window.confirm(
        'Cambiando variante verranno resettate le selezioni. Continuare?',
      )
      if (!confirmed) return
    }
    setContent(isProdotto(variant) ? { ...DEFAULT_PRODOTTO, variant, image_ratio: value.image_ratio } : { ...DEFAULT_REF, variant, image_ratio: value.image_ratio })
    setResults([])
    setSearch('')
  }

  const handleProdottoModeChange = (selection_mode: 'manual' | 'dynamic') => {
    if (selection_mode === value.selection_mode) return
    if (selection_mode === 'dynamic') {
      setContent({
        ...value,
        selection_mode,
        items: [],
      })
      return
    }
    setContent({
      ...value,
      selection_mode,
      items: [],
      vista: undefined,
      category: '',
      subcategory: '',
      application_area: '',
      bestseller: false,
    })
  }

  const handleRefModeChange = (selection_mode: 'all' | 'manual' | 'tag') => {
    if (selection_mode === value.selection_mode) return
    setContent({
      ...value,
      selection_mode,
      tag: selection_mode === 'tag' ? value.tag ?? '' : '',
      items: [],
    })
  }

  const toggleItem = (story: StoryOption) => {
    const selected = isStorySelected(value, story.uuid)
    let items: string[]

    if (isProdotto(value.variant)) {
      if (value.selection_mode !== 'manual') return
      items = selected
        ? value.items.filter((id) => id !== story.uuid)
        : [...value.items, story.uuid]
    } else if (value.selection_mode === 'manual') {
      items = selected
        ? value.items.filter((id) => id !== story.uuid)
        : [...value.items, story.uuid]
    } else {
      items = selected
        ? [...value.items, story.uuid]
        : value.items.filter((id) => id !== story.uuid)
    }

    setContent({ ...value, items })
  }

  const subcategoryOptions = useMemo(() => {
    if (!value.category) return []
    return getSubfiltersForCategory(value.category, filtriEntries)
  }, [value.category, filtriEntries])

  const showPicker =
    !isCarousel &&
    !isProjectsHighlight &&
    !isEditorial &&
    ((isProdotto(value.variant) && value.selection_mode === 'manual') ||
      (!isProdotto(value.variant) &&
        value.selection_mode !== 'tag' &&
        (value.selection_mode === 'all' || value.selection_mode === 'manual')))

  useEffect(() => {
    if (plugin.type !== 'loaded' || isCarousel || isProjectsHighlight || isEditorial || !isProdotto(value.variant)) return

    let cancelled = false
    Promise.all([
      fetchFiltriCategories(datasourceSlug, cdnToken),
      fetchAllFiltriEntries(datasourceSlug, cdnToken),
    ])
      .then(([cats, entries]) => {
        if (!cancelled) {
          setCategories(cats)
          setFiltriEntries(entries)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([])
          setFiltriEntries([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [plugin.type, isCarousel, isProjectsHighlight, isEditorial, value.variant, datasourceSlug, cdnToken])

  useEffect(() => {
    if (plugin.type !== 'loaded' || !showPicker) {
      setResults([])
      return
    }

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const stories = await searchStories(
          value.variant === 'story' ? 'story' : (value.variant as ListingVariantSlug),
          cdnToken,
          search,
        )
        if (!cancelled) {
          setResults(sortStoryOptions(stories))
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
  }, [plugin.type, value.variant, showPicker, cdnToken, search])

  if (plugin.type !== 'loaded') {
    return <p className="listing-items__loading">Caricamento editor...</p>
  }

  if (isCarousel) {
    return <CarouselItems plugin={plugin} />
  }

  if (isProjectsHighlight) {
    return <ProjectsHighlightItems plugin={plugin} />
  }

  if (isEditorial) {
    return (
      <div className="listing-items">
        <div className="listing-items__field">
          <label className="listing-items__label" htmlFor="listing-image-ratio">
            Formato immagine
          </label>
          <select
            id="listing-image-ratio"
            className="listing-items__select"
            value={value.image_ratio ?? 'portrait'}
            onChange={(e) =>
              updateOptions({ image_ratio: e.target.value as ListingImageRatio })
            }
          >
            {IMAGE_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  if (!cdnToken) {
    return (
      <p className="listing-items__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  const isDynamic = isProdotto(value.variant) && value.selection_mode === 'dynamic'
  const selectedCount = isRefAllMode(value)
    ? results.length - value.items.length
    : value.items.length

  return (
    <div className="listing-items">
      <div className="listing-items__field">
        <label className="listing-items__label" htmlFor="listing-variant">
          Variante
        </label>
        <select
          id="listing-variant"
          className="listing-items__select"
          value={value.variant}
          onChange={(e) => handleVariantChange(e.target.value as ListingVariantSlug)}
        >
          {variantOptions.map((variant) => (
            <option key={variant} value={variant}>
              {getVariantLabel(variant)}
            </option>
          ))}
        </select>
      </div>

      {isProdotto(value.variant) && (
        <>
          <fieldset className="listing-items__fieldset">
            <legend className="listing-items__label">Modalità</legend>
            <label className="listing-items__radio">
              <input
                type="radio"
                name="listing-prodotto-mode"
                checked={value.selection_mode === 'dynamic'}
                onChange={() => handleProdottoModeChange('dynamic')}
              />
              Dinamica
            </label>
            <label className="listing-items__radio">
              <input
                type="radio"
                name="listing-prodotto-mode"
                checked={value.selection_mode === 'manual'}
                onChange={() => handleProdottoModeChange('manual')}
              />
              Manuale
            </label>
          </fieldset>

          {isDynamic && (
            <div className="listing-items__options">
              <label className="listing-items__checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(value.bestseller)}
                  onChange={(e) => updateOptions({ bestseller: e.target.checked })}
                />
                Bestseller
              </label>

              <div className="listing-items__field">
                <label className="listing-items__label" htmlFor="listing-vista">
                  Vista (opzionale)
                </label>
                <select
                  id="listing-vista"
                  className="listing-items__select"
                  value={value.vista ?? ''}
                  onChange={(e) => {
                    const next = e.target.value as ListingProductVista | ''
                    updateOptions({
                      vista: next || undefined,
                      category: next === 'categoria' ? value.category ?? '' : '',
                      subcategory: next === 'categoria' ? value.subcategory ?? '' : '',
                      application_area:
                        next === 'application_area' ? value.application_area ?? '' : '',
                    })
                  }}
                >
                  <option value="">Nessuna vista aggiuntiva</option>
                  {VISTAS.map((vista) => (
                    <option key={vista.value} value={vista.value}>
                      {vista.label}
                    </option>
                  ))}
                </select>
              </div>

              {value.vista === 'categoria' && (
                <>
                  <div className="listing-items__field">
                    <label className="listing-items__label" htmlFor="listing-category">
                      Categoria
                    </label>
                    <select
                      id="listing-category"
                      className="listing-items__select"
                      value={value.category ?? ''}
                      onChange={(e) =>
                        updateOptions({ category: e.target.value, subcategory: '' })
                      }
                    >
                      <option value="">Tutte le categorie</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {value.category && subcategoryOptions.length > 0 && (
                    <div className="listing-items__field">
                      <label className="listing-items__label" htmlFor="listing-subcategory">
                        Sottocategoria
                      </label>
                      <select
                        id="listing-subcategory"
                        className="listing-items__select"
                        value={value.subcategory ?? ''}
                        onChange={(e) => updateOptions({ subcategory: e.target.value })}
                      >
                        <option value="">Tutte le sottocategorie</option>
                        {subcategoryOptions.map((entry) => (
                          <option key={entry.value} value={entry.value}>
                            {getSubfilterLabel(entry.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {value.vista === 'application_area' && (
                <div className="listing-items__field">
                  <label className="listing-items__label" htmlFor="listing-application-area">
                    Application area
                  </label>
                  <select
                    id="listing-application-area"
                    className="listing-items__select"
                    value={value.application_area ?? ''}
                    onChange={(e) => updateOptions({ application_area: e.target.value })}
                  >
                    <option value="">Seleziona settore</option>
                    {applicationAreaOptions.map((entry) => (
                      <option key={entry.name} value={entry.name}>
                        {entry.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!isProdotto(value.variant) && (
        <fieldset className="listing-items__fieldset">
          <legend className="listing-items__label">Modalità</legend>
          <label className="listing-items__radio">
            <input
              type="radio"
              name="listing-ref-mode"
              checked={value.selection_mode === 'all'}
              onChange={() => handleRefModeChange('all')}
            />
            Tutti (deseleziona quelli da escludere)
          </label>
          {value.variant === 'progetto' && (
            <label className="listing-items__radio">
              <input
                type="radio"
                name="listing-ref-mode"
                checked={value.selection_mode === 'tag'}
                onChange={() => handleRefModeChange('tag')}
              />
              Per tag
            </label>
          )}
          <label className="listing-items__radio">
            <input
              type="radio"
              name="listing-ref-mode"
              checked={value.selection_mode === 'manual'}
              onChange={() => handleRefModeChange('manual')}
            />
            Solo selezionati manualmente
          </label>
          {value.variant === 'progetto' && (
            <p className="listing-items__hint">
              I progetti sono sempre ordinati per ultimi aggiunti.
            </p>
          )}
        </fieldset>
      )}

      {value.variant === 'progetto' && value.selection_mode === 'tag' && (
        <div className="listing-items__field">
          <label className="listing-items__label" htmlFor="listing-project-tag">
            Tag / divisione
          </label>
          <select
            id="listing-project-tag"
            className="listing-items__select"
            value={value.tag ?? ''}
            onChange={(e) =>
              updateOptions({ tag: e.target.value as ProjectDivision | '' })
            }
          >
            <option value="">Seleziona un tag</option>
            {PROJECT_DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {PROJECT_DIVISION_LABELS[division]}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPicker && (
        <>
          <div className="listing-items__field">
            <label className="listing-items__label" htmlFor="listing-search">
              Cerca {getVariantLabel(value.variant).toLowerCase()}
            </label>
            <input
              id="listing-search"
              className="listing-items__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome story..."
            />
          </div>

          {results.length > 0 && (
            <p className="listing-items__count">
              {isRefAllMode(value)
                ? `${selectedCount} di ${results.length} selezionati`
                : `${value.items.length} selezionati`}
            </p>
          )}
        </>
      )}

      {loading && <p className="listing-items__loading">Ricerca in corso...</p>}
      {error && <p className="listing-items__error">{error}</p>}

      {showPicker && results.length > 0 && (
        <div className="listing-items__results">
          {results.map((story) => {
            const selected = isStorySelected(value, story.uuid)
            return (
              <button
                key={story.uuid}
                type="button"
                className={cnResult(selected)}
                aria-pressed={selected}
                onClick={() => toggleItem(story)}
              >
                <span>{story.name}</span>
                {selected && <span className="listing-items__check">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function cnResult(isSelected: boolean): string {
  return isSelected
    ? 'listing-items__result listing-items__result--selected'
    : 'listing-items__result'
}

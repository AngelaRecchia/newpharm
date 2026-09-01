import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import applicationAreas from '../../data/application-areas-entries.json'
import {
  fetchAllFiltriEntries,
  fetchFiltriCategories,
  getCategoryLabel,
  getSubfilterLabel,
  getSubfiltersForCategory,
} from '../../lib/filtri'
import {
  getVariantLabel,
  localeFromPluginStory,
  searchStories,
  sortStoryOptions,
} from '../../lib/stories'
import type {
  ApplicationAreaEntry,
  CarouselInsectMode,
  CarouselStoryMode,
  CarouselVariantSlug,
  FiltriEntry,
  ListingProductVista,
  PluginVariantValue,
  StoryOption,
} from '../../types'
import {
  CAROUSEL_LIMIT,
  EMPTY_CAROUSEL_VALUE,
  STORY_TAG_LABELS,
  STORY_TAGS,
} from '../../types'
import '../ListingItems/listing-items.css'

const CAROUSEL_VARIANTS: CarouselVariantSlug[] = ['story', 'prodotto', 'editorial', 'insetto']

const VISTAS: { value: ListingProductVista; label: string }[] = [
  { value: 'categoria', label: 'Categoria' },
  { value: 'application_area', label: 'Application area' },
]

const STORY_MODES: { value: CarouselStoryMode; label: string }[] = [
  { value: 'dynamic', label: 'Automatica (ultime 8)' },
  { value: 'tag', label: 'Per tag (ultime 8)' },
  { value: 'manual', label: 'Manuale' },
]

const DEFAULT_STORY: PluginVariantValue = { ...EMPTY_CAROUSEL_VALUE }

const DEFAULT_PRODUCT: PluginVariantValue = {
  variant: 'prodotto',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  context: 'carousel',
}

const DEFAULT_EDITORIAL: PluginVariantValue = {
  variant: 'editorial',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  context: 'carousel',
}

const DEFAULT_INSECT: PluginVariantValue = {
  variant: 'insetto',
  selection_mode: 'all',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  context: 'carousel',
}

function defaultForVariant(variant: CarouselVariantSlug): PluginVariantValue {
  if (variant === 'prodotto') return { ...DEFAULT_PRODUCT }
  if (variant === 'editorial') return { ...DEFAULT_EDITORIAL }
  if (variant === 'insetto') return { ...DEFAULT_INSECT }
  return { ...DEFAULT_STORY }
}

function isCarouselVariant(variant: PluginVariantValue['variant']): variant is CarouselVariantSlug {
  return (
    variant === 'story' ||
    variant === 'prodotto' ||
    variant === 'editorial' ||
    variant === 'insetto'
  )
}

function isInsectSelected(value: PluginVariantValue, uuid: string): boolean {
  const items = Array.isArray(value.items) ? value.items : []
  if (value.selection_mode === 'manual') return items.includes(uuid)
  return !items.includes(uuid)
}

type CarouselPlugin = ReturnType<typeof useFieldPlugin<PluginVariantValue>>

type CarouselItemsProps = {
  plugin: CarouselPlugin
}

export function CarouselItems({ plugin }: CarouselItemsProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<StoryOption[]>([])
  const [categories, setCategories] = useState<FiltriEntry[]>([])
  const [filtriEntries, setFiltriEntries] = useState<FiltriEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = plugin.data?.options ?? {}
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''
  const datasourceSlug = options.datasource_slug || 'filtri'
  const value = plugin.data?.content ?? DEFAULT_STORY
  const locale = localeFromPluginStory(plugin.data?.story)
  const applicationAreaOptions = applicationAreas as ApplicationAreaEntry[]

  const didInit = useRef(false)

  const setContent = useCallback(
    (next: PluginVariantValue) => {
      plugin.actions?.setContent({ ...next, context: 'carousel' })
    },
    [plugin.actions],
  )

  const updateOptions = (patch: Partial<PluginVariantValue>) => {
    setContent({ ...value, ...patch, context: 'carousel' })
  }

  useEffect(() => {
    if (plugin.type !== 'loaded' || didInit.current) return
    didInit.current = true

    if (value.context === 'carousel' && isCarouselVariant(value.variant)) return

    if (value.variant === 'story' || value.variant === 'editorial' || value.variant === 'insetto') {
      setContent({ ...value, context: 'carousel' })
      return
    }

    if (
      value.variant === 'prodotto' &&
      (value.bestseller || value.category || value.vista || value.items.length > 0)
    ) {
      setContent({
        ...value,
        selection_mode: 'dynamic',
        items: [],
        context: 'carousel',
      })
      return
    }

    setContent(DEFAULT_STORY)
  }, [plugin.type, value, setContent])

  const handleVariantChange = (variant: CarouselVariantSlug) => {
    if (variant === value.variant) return
    if (value.items.length > 0 || value.tag || value.category || value.bestseller) {
      const confirmed = window.confirm(
        'Cambiando variante verranno resettate le selezioni. Continuare?',
      )
      if (!confirmed) return
    }
    setContent(defaultForVariant(variant))
    setResults([])
    setSearch('')
  }

  const handleStoryModeChange = (selection_mode: CarouselStoryMode) => {
    if (selection_mode === value.selection_mode) return
    setContent({
      ...value,
      selection_mode,
      tag: selection_mode === 'tag' ? value.tag ?? '' : '',
      items: [],
    })
    setResults([])
    setSearch('')
  }

  const handleInsectModeChange = (selection_mode: CarouselInsectMode) => {
    if (selection_mode === value.selection_mode) return
    setContent({
      ...value,
      selection_mode,
      tag: '',
      items: [],
    })
    setResults([])
    setSearch('')
  }

  const toggleItem = (story: StoryOption) => {
    if (value.variant === 'insetto') {
      const selected = isInsectSelected(value, story.uuid)
      const items =
        value.selection_mode === 'manual'
          ? selected
            ? value.items.filter((id) => id !== story.uuid)
            : [...value.items, story.uuid]
          : selected
            ? [...value.items, story.uuid]
            : value.items.filter((id) => id !== story.uuid)

      setContent({ ...value, items })
      return
    }

    const selected = value.items.includes(story.uuid)
    if (!selected && value.items.length >= CAROUSEL_LIMIT) return

    const items = selected
      ? value.items.filter((id) => id !== story.uuid)
      : [...value.items, story.uuid]

    setContent({ ...value, items })
  }

  const subcategoryOptions = useMemo(() => {
    if (!value.category) return []
    return getSubfiltersForCategory(value.category, filtriEntries)
  }, [value.category, filtriEntries])

  const isProduct = value.variant === 'prodotto'
  const isStory = value.variant === 'story'
  const isEditorial = value.variant === 'editorial'
  const isInsect = value.variant === 'insetto'
  const isInsectAllMode = isInsect && value.selection_mode === 'all'
  const showPicker =
    (isStory && value.selection_mode === 'manual') ||
    (isInsect && (value.selection_mode === 'all' || value.selection_mode === 'manual'))

  useEffect(() => {
    if (plugin.type !== 'loaded' || !isProduct) return

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
  }, [plugin.type, isProduct, datasourceSlug, cdnToken])

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
          isInsect ? 'insetto' : 'story',
          cdnToken,
          search,
          locale,
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
  }, [plugin.type, showPicker, isInsect, cdnToken, search, locale])

  if (plugin.type !== 'loaded') {
    return <p className="listing-items__loading">Caricamento editor...</p>
  }

  if (isEditorial) {
    return (
      <div className="listing-items">
        <div className="listing-items__field">
          <label className="listing-items__label" htmlFor="carousel-variant">
            Variante
          </label>
          <select
            id="carousel-variant"
            className="listing-items__select"
            value={value.variant}
            onChange={(e) => handleVariantChange(e.target.value as CarouselVariantSlug)}
          >
            {CAROUSEL_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {getVariantLabel(variant)}
              </option>
            ))}
          </select>
        </div>
        <p className="listing-items__info">
          Inserisci le card nel campo Cards del blocco. Non vengono popolate automaticamente.
        </p>
      </div>
    )
  }

  if (!cdnToken && (isProduct || showPicker)) {
    return (
      <p className="listing-items__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  return (
    <div className="listing-items">
      <div className="listing-items__field">
        <label className="listing-items__label" htmlFor="carousel-variant">
          Variante
        </label>
        <select
          id="carousel-variant"
          className="listing-items__select"
          value={isCarouselVariant(value.variant) ? value.variant : 'story'}
          onChange={(e) => handleVariantChange(e.target.value as CarouselVariantSlug)}
        >
          {CAROUSEL_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>
              {getVariantLabel(variant)}
            </option>
          ))}
        </select>
      </div>

      {isStory && (
        <>
          <fieldset className="listing-items__fieldset">
            <legend className="listing-items__label">Modalità</legend>
            {STORY_MODES.map((mode) => (
              <label key={mode.value} className="listing-items__radio">
                <input
                  type="radio"
                  name="carousel-story-mode"
                  checked={value.selection_mode === mode.value}
                  onChange={() => handleStoryModeChange(mode.value)}
                />
                {mode.label}
              </label>
            ))}
          </fieldset>

          {value.selection_mode === 'dynamic' && (
            <p className="listing-items__hint">
              Mostra automaticamente le 8 news più recenti.
            </p>
          )}

          {value.selection_mode === 'tag' && (
            <div className="listing-items__field">
              <label className="listing-items__label" htmlFor="carousel-story-tag">
                Tag
              </label>
              <select
                id="carousel-story-tag"
                className="listing-items__select"
                value={value.tag ?? ''}
                onChange={(e) => updateOptions({ tag: e.target.value })}
              >
                <option value="">Seleziona un tag</option>
                {STORY_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {STORY_TAG_LABELS[tag]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {isInsect && (
        <fieldset className="listing-items__fieldset">
          <legend className="listing-items__label">Modalità</legend>
          <label className="listing-items__radio">
            <input
              type="radio"
              name="carousel-insect-mode"
              checked={value.selection_mode === 'all'}
              onChange={() => handleInsectModeChange('all')}
            />
            Tutti (deseleziona quelli da escludere)
          </label>
          <label className="listing-items__radio">
            <input
              type="radio"
              name="carousel-insect-mode"
              checked={value.selection_mode === 'manual'}
              onChange={() => handleInsectModeChange('manual')}
            />
            Solo selezionati manualmente
          </label>
        </fieldset>
      )}

      {isProduct && (
        <div className="listing-items__options">
          <p className="listing-items__hint">
            Mostra gli ultimi 8 prodotti. I filtri restringono il pool prima del taglio.
          </p>
          <label className="listing-items__checkbox">
            <input
              type="checkbox"
              checked={Boolean(value.bestseller)}
              onChange={(e) => updateOptions({ bestseller: e.target.checked })}
            />
            Bestseller
          </label>

          <div className="listing-items__field">
            <label className="listing-items__label" htmlFor="carousel-vista">
              Vista (opzionale)
            </label>
            <select
              id="carousel-vista"
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
                <label className="listing-items__label" htmlFor="carousel-category">
                  Categoria
                </label>
                <select
                  id="carousel-category"
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
                  <label className="listing-items__label" htmlFor="carousel-subcategory">
                    Sottocategoria
                  </label>
                  <select
                    id="carousel-subcategory"
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
              <label className="listing-items__label" htmlFor="carousel-application-area">
                Application area
              </label>
              <select
                id="carousel-application-area"
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

      {showPicker && (
        <>
          <div className="listing-items__field">
            <label className="listing-items__label" htmlFor="carousel-search">
              Cerca {isInsect ? getVariantLabel('insetto').toLowerCase() : 'story'}
            </label>
            <input
              id="carousel-search"
              className="listing-items__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome story..."
            />
          </div>
          {(isInsect ? results.length > 0 : true) && (
            <p className="listing-items__count">
              {isInsectAllMode
                ? `${results.length - value.items.length} di ${results.length} selezionati`
                : isInsect
                  ? `${value.items.length} selezionati`
                  : `${value.items.length} di ${CAROUSEL_LIMIT} selezionati`}
            </p>
          )}
        </>
      )}

      {loading && <p className="listing-items__loading">Ricerca in corso...</p>}
      {error && <p className="listing-items__error">{error}</p>}

      {showPicker && results.length > 0 && (
        <div className="listing-items__results">
          {results.map((story) => {
            const selected = isInsect
              ? isInsectSelected(value, story.uuid)
              : value.items.includes(story.uuid)
            const disabled =
              !isInsect && !selected && value.items.length >= CAROUSEL_LIMIT
            return (
              <button
                key={story.uuid}
                type="button"
                className={
                  selected
                    ? 'listing-items__result listing-items__result--selected'
                    : 'listing-items__result'
                }
                aria-pressed={selected}
                disabled={disabled}
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

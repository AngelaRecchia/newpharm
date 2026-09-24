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
  fetchStoriesByUuids,
  getVariantLabel,
  isStorySelected as isUuidInSelection,
  localeFromPluginStory,
  searchStories,
  sortStoryOptions,
  storySelectionIds,
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

const CAROUSEL_VARIANTS: CarouselVariantSlug[] = ['story', 'prodotto', 'editorial', 'infestante', 'related_products']

const VISTAS: { value: ListingProductVista; label: string }[] = [
  { value: 'categoria', label: 'Categoria' },
  { value: 'application_area', label: 'Application area' },
]

const STORY_MODES: { value: CarouselStoryMode; label: string }[] = [
  { value: 'dynamic', label: 'Automatica (ultime 8)' },
  { value: 'tag', label: 'Per tag (ultime 8)' },
  { value: 'manual', label: 'Manuale' },
]

const PRODUCT_MODES: { value: 'manual' | 'dynamic'; label: string }[] = [
  { value: 'dynamic', label: 'Dinamica (ultimi 8)' },
  { value: 'manual', label: 'Manuale' },
]

const RELATED_PRODUCTS_MODES: { value: 'manual' | 'dynamic'; label: string }[] = [
  { value: 'manual', label: 'Manuale (seleziona singoli prodotti)' },
  { value: 'dynamic', label: 'Automatica (per categoria / application area)' },
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
  variant: 'infestante',
  selection_mode: 'all',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  context: 'carousel',
}

const DEFAULT_RELATED_PRODUCTS: PluginVariantValue = {
  variant: 'related_products',
  selection_mode: 'manual',
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
  if (variant === 'infestante') return { ...DEFAULT_INSECT }
  if (variant === 'related_products') return { ...DEFAULT_RELATED_PRODUCTS }
  return { ...DEFAULT_STORY }
}

function isPestVariant(variant: PluginVariantValue['variant']): boolean {
  return variant === 'infestante' || variant === 'insetto'
}

function isCarouselVariant(variant: PluginVariantValue['variant']): variant is CarouselVariantSlug {
  return (
    variant === 'story' ||
    variant === 'prodotto' ||
    variant === 'editorial' ||
    variant === 'infestante' ||
    variant === 'related_products'
  )
}

function carouselSelectValue(variant: PluginVariantValue['variant']): CarouselVariantSlug {
  if (variant === 'insetto') return 'infestante'
  return isCarouselVariant(variant) ? variant : 'story'
}

function isInsectSelected(
  value: PluginVariantValue,
  uuid: string,
  selectedStories: StoryOption[],
  results: StoryOption[],
): boolean {
  const items = Array.isArray(value.items) ? value.items : []
  const inSelection = isUuidInSelection(uuid, items, selectedStories, results)
  if (value.selection_mode === 'manual') return inSelection
  return !inSelection
}

type CarouselPlugin = ReturnType<typeof useFieldPlugin<PluginVariantValue>>

type CarouselItemsProps = {
  plugin: CarouselPlugin
  /** Vincola la variante (es. related_products su content type story) e nasconde il dropdown Variante */
  forceVariant?: CarouselVariantSlug
}

export function CarouselItems({ plugin, forceVariant }: CarouselItemsProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<StoryOption[]>([])
  const [selectedStories, setSelectedStories] = useState<StoryOption[]>([])
  const [categories, setCategories] = useState<FiltriEntry[]>([])
  const [filtriEntries, setFiltriEntries] = useState<FiltriEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = plugin.data?.options ?? {}
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''
  const datasourceSlug = options.datasource_slug || 'filtri'
  const value =
    plugin.data?.content ?? (forceVariant ? defaultForVariant(forceVariant) : DEFAULT_STORY)
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

    // Campo vincolato (es. related_products su story): forza la variante e i default corretti.
    // Gestisce anche i valori legacy salvati con variant diversa (es. 'prodotto') prima del fix.
    if (forceVariant) {
      if (value.variant === forceVariant && value.context === 'carousel') return
      if (value.variant === forceVariant) {
        setContent({ ...value, context: 'carousel' })
        return
      }
      setContent({
        ...defaultForVariant(forceVariant),
        items: value.variant === 'related_products' ? value.items : [],
      })
      return
    }

    if (value.context === 'carousel' && isCarouselVariant(value.variant)) return

    if (value.variant === 'story' || value.variant === 'editorial' || isPestVariant(value.variant)) {
      setContent({
        ...value,
        variant: isPestVariant(value.variant) ? 'infestante' : value.variant,
        context: 'carousel',
      })
      return
    }

    if (value.variant === 'prodotto') {
      const selection_mode =
        value.selection_mode === 'manual' ||
        (value.selection_mode !== 'dynamic' && value.items.length > 0)
          ? 'manual'
          : 'dynamic'
      setContent({
        ...value,
        selection_mode,
        items: selection_mode === 'manual' ? value.items.slice(0, CAROUSEL_LIMIT) : [],
        context: 'carousel',
      })
      return
    }

    setContent(DEFAULT_STORY)
  }, [plugin.type, value, setContent, forceVariant])

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

  const handleProductModeChange = (selection_mode: 'manual' | 'dynamic') => {
    if (selection_mode === value.selection_mode) return
    if (selection_mode === 'dynamic') {
      setContent({
        ...value,
        selection_mode,
        items: [],
      })
    } else {
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
    setResults([])
    setSearch('')
  }

  const handleRelatedProductsModeChange = (selection_mode: 'manual' | 'dynamic') => {
    if (selection_mode === value.selection_mode) return
    setContent({
      ...value,
      selection_mode,
      items: selection_mode === 'manual' ? value.items : [],
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
    if (isPestVariant(value.variant)) {
      const selected = isInsectSelected(value, story.uuid, selectedStories, results)
      const relatedIds = new Set(
        storySelectionIds(story, [...selectedStories, ...results, story]),
      )
      const items =
        value.selection_mode === 'manual'
          ? selected
            ? value.items.filter((id) => !relatedIds.has(id))
            : [...value.items, story.uuid]
          : selected
            ? [...value.items.filter((id) => !relatedIds.has(id)), story.uuid]
            : value.items.filter((id) => !relatedIds.has(id))

      setContent({ ...value, items })
      return
    }

    const selected = value.items.includes(story.uuid)
    if (!isRelatedProducts && !isPestVariant(value.variant) && !selected && value.items.length >= CAROUSEL_LIMIT) return

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
  const isRelatedProducts = value.variant === 'related_products'
  const isStory = value.variant === 'story'
  const isEditorial = value.variant === 'editorial'
  const isInsect = isPestVariant(value.variant)
  const isInsectAllMode = isInsect && value.selection_mode === 'all'
  const isProductManual = isProduct && value.selection_mode === 'manual'
  const isProductDynamic = isProduct && value.selection_mode === 'dynamic'
  const isRelatedProductsManual = isRelatedProducts && value.selection_mode === 'manual'
  const isRelatedProductsDynamic = isRelatedProducts && value.selection_mode === 'dynamic'
  const showPicker =
    (isStory && value.selection_mode === 'manual') ||
    (isInsect && (value.selection_mode === 'all' || value.selection_mode === 'manual')) ||
    isProductManual ||
    isRelatedProductsManual

  const visibleResults = useMemo(() => {
    if (!isInsect || value.selection_mode !== 'manual') return results
    const index = new Map(value.items.map((id, position) => [id, position]))
    return [...results].sort((a, b) => {
      const aIndex = index.get(a.uuid)
      const bIndex = index.get(b.uuid)
      if (aIndex != null && bIndex != null) return aIndex - bIndex
      if (aIndex != null) return -1
      if (bIndex != null) return 1
      return 0
    })
  }, [results, isInsect, value.selection_mode, value.items])

  useEffect(() => {
    if (plugin.type !== 'loaded' || (!isProduct && !isRelatedProducts)) return

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
  }, [plugin.type, isProduct, isRelatedProducts, datasourceSlug, cdnToken])

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
        const searchVariant =
          isRelatedProducts || isProduct ? 'prodotto' : isInsect ? 'infestante' : 'story'
        const stories = await searchStories(
          searchVariant,
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
  }, [plugin.type, showPicker, isRelatedProducts, isProduct, isInsect, cdnToken, search, locale])

  const itemUuids = Array.isArray(value.items) ? value.items.join(',') : ''

  useEffect(() => {
    if (plugin.type !== 'loaded' || !isInsect || !cdnToken || !itemUuids) {
      setSelectedStories([])
      return
    }

    let cancelled = false
    fetchStoriesByUuids(cdnToken, itemUuids.split(',').filter(Boolean))
      .then((stories) => {
        if (!cancelled) setSelectedStories(stories)
      })
      .catch(() => {
        if (!cancelled) setSelectedStories([])
      })

    return () => {
      cancelled = true
    }
  }, [plugin.type, isInsect, cdnToken, itemUuids])

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
            value={carouselSelectValue(value.variant)}
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

  if (!cdnToken && (isProduct || isRelatedProducts || showPicker)) {
    return (
      <p className="listing-items__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  return (
    <div className="listing-items">
      {!forceVariant && (
        <div className="listing-items__field">
          <label className="listing-items__label" htmlFor="carousel-variant">
            Variante
          </label>
          <select
            id="carousel-variant"
            className="listing-items__select"
            value={carouselSelectValue(value.variant)}
            onChange={(e) => handleVariantChange(e.target.value as CarouselVariantSlug)}
          >
            {CAROUSEL_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {getVariantLabel(variant)}
              </option>
            ))}
          </select>
        </div>
      )}

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

      {isInsect && value.selection_mode === 'manual' && (
        <p className="listing-items__hint">
          L'ordine è quello di selezione.
        </p>
      )}

      {isProduct && (
        <>
          <fieldset className="listing-items__fieldset">
            <legend className="listing-items__label">Modalità</legend>
            {PRODUCT_MODES.map((mode) => (
              <label key={mode.value} className="listing-items__radio">
                <input
                  type="radio"
                  name="carousel-product-mode"
                  checked={value.selection_mode === mode.value}
                  onChange={() => handleProductModeChange(mode.value)}
                />
                {mode.label}
              </label>
            ))}
          </fieldset>

          {isProductManual && (
            <p className="listing-items__hint">
              Cerca e seleziona fino a {CAROUSEL_LIMIT} prodotti. L'ordine è quello di selezione.
            </p>
          )}

          {isProductDynamic && (
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
        </>
      )}

      {isRelatedProducts && (
        <>
          <fieldset className="listing-items__fieldset">
            <legend className="listing-items__label">Modalità</legend>
            {RELATED_PRODUCTS_MODES.map((mode) => (
              <label key={mode.value} className="listing-items__radio">
                <input
                  type="radio"
                  name="carousel-related-products-mode"
                  checked={value.selection_mode === mode.value}
                  onChange={() => handleRelatedProductsModeChange(mode.value)}
                />
                {mode.label}
              </label>
            ))}
          </fieldset>

          {isRelatedProductsManual && (
            <p className="listing-items__hint">
              Cerca e seleziona i prodotti correlati.
            </p>
          )}

          {isRelatedProductsDynamic && (
            <div className="listing-items__options">
              <p className="listing-items__hint">
                Mostra automaticamente i prodotti del pool. I filtri restringono la selezione.
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
        </>
      )}

      {showPicker && (
        <>
          <div className="listing-items__field">
            <label className="listing-items__label" htmlFor="carousel-search">
              {isInsect
                ? 'Cerca infestanti'
                : isProduct || isRelatedProducts
                  ? 'Cerca prodotti'
                  : 'Cerca news'}
            </label>
            <input
              id="carousel-search"
              className="listing-items__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isInsect
                  ? 'Nome infestante...'
                  : isProduct || isRelatedProducts
                    ? 'Nome prodotto...'
                    : 'Nome story...'
              }
            />
          </div>
          <p className="listing-items__count">
            {isInsectAllMode
              ? `${results.filter((story) => isInsectSelected(value, story.uuid, selectedStories, results)).length} di ${results.length} selezionati`
              : isInsect || isRelatedProducts
                ? `${value.items.length} selezionati`
                : `${value.items.length} di ${CAROUSEL_LIMIT} selezionati`}
          </p>
        </>
      )}

      {showPicker && visibleResults.length > 0 && (
        <div className="listing-items__results">
          {visibleResults.map((story) => {
            const selected = isInsect
              ? isInsectSelected(value, story.uuid, selectedStories, results)
              : value.items.includes(story.uuid)
            const disabled =
              !isRelatedProducts &&
              !isInsect &&
              !selected &&
              value.items.length >= CAROUSEL_LIMIT
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

      {loading && <p className="listing-items__loading">Ricerca in corso...</p>}
      {error && <p className="listing-items__error">{error}</p>}
    </div>
  )
}

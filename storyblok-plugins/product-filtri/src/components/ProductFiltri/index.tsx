import { useEffect, useMemo, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import {
  fetchFiltriEntries,
  getCategoryLabel,
  getSubfilterLabel,
  getSubfiltersForCategory,
  parseFiltriEntries,
} from '../../lib/filtri'
import { validateContent } from '../../lib/validateContent'
import type { ProductFiltriValue } from '../../types'
import './product-filtri.css'

const DEFAULT_DATASOURCE = 'filtri'

export function ProductFiltri() {
  const plugin = useFieldPlugin<ProductFiltriValue>({
    validateContent,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState(() =>
    parseFiltriEntries([]),
  )

  const options = plugin.data?.options ?? {}
  const datasourceSlug = options.datasource_slug || DEFAULT_DATASOURCE
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''

  const value = plugin.data?.content ?? { category: '', subcategories: [] }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const entries = await fetchFiltriEntries(datasourceSlug, cdnToken)
        if (!cancelled) {
          setParsed(parseFiltriEntries(entries))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore caricamento filtri')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (plugin.type === 'loaded') {
      load()
    }

    return () => {
      cancelled = true
    }
  }, [plugin.type, datasourceSlug, cdnToken])

  const availableSubfilters = useMemo(
    () => getSubfiltersForCategory(value.category, parsed),
    [value.category, parsed],
  )

  const setContent = (next: ProductFiltriValue) => {
    plugin.actions?.setContent(next)
  }

  const handleCategoryChange = (category: string) => {
    const validSubs = new Set(
      getSubfiltersForCategory(category, parsed).map((entry) => entry.value),
    )
    setContent({
      category,
      subcategories: value.subcategories.filter((sub) => validSubs.has(sub)),
    })
  }

  const toggleSubcategory = (subValue: string) => {
    const selected = new Set(value.subcategories)
    if (selected.has(subValue)) {
      selected.delete(subValue)
    } else {
      selected.add(subValue)
    }
    setContent({
      category: value.category,
      subcategories: [...selected],
    })
  }

  if (plugin.type !== 'loaded') {
    return <p className="product-filtri__loading">Caricamento editor...</p>
  }

  if (loading) {
    return <p className="product-filtri__loading">Caricamento filtri...</p>
  }

  return (
    <div className="product-filtri">
      {error && <p className="product-filtri__error">{error}</p>}

      <div className="product-filtri__field">
        <label className="product-filtri__label" htmlFor="product-filtri-category">
          Categoria
        </label>
        <select
          id="product-filtri-category"
          className="product-filtri__select"
          value={value.category}
          onChange={(event) => handleCategoryChange(event.target.value)}
        >
          <option value="">Seleziona categoria</option>
          {parsed.categories.map((category) => (
            <option key={category.value} value={category.value}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="product-filtri__field">
        <span className="product-filtri__label">Sottofiltri</span>
        {!value.category ? (
          <p className="product-filtri__hint">Seleziona prima una categoria.</p>
        ) : availableSubfilters.length === 0 ? (
          <p className="product-filtri__hint">Nessun sottofiltro per questa categoria.</p>
        ) : (
          <div className="product-filtri__subfilters">
            {availableSubfilters.map((sub) => (
              <label key={sub.value} className="product-filtri__checkbox">
                <input
                  type="checkbox"
                  checked={value.subcategories.includes(sub.value)}
                  onChange={() => toggleSubcategory(sub.value)}
                />
                <span>{getSubfilterLabel(sub.name)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {value.subcategories.length > 0 && (
        <p className="product-filtri__hint">
          {value.subcategories.length} sottofiltri selezionati
        </p>
      )}
    </div>
  )
}

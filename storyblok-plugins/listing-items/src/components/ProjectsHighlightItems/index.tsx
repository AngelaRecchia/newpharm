import { useEffect, useRef, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import { localeFromPluginStory, searchStories, sortStoryOptions } from '../../lib/stories'
import type { PluginVariantValue, ProjectDivision, StoryOption } from '../../types'
import {
  EMPTY_PROJECTS_HIGHLIGHT_VALUE,
  PROJECT_DIVISION_LABELS,
  PROJECT_DIVISIONS,
} from '../../types'
import '../ListingItems/listing-items.css'

const MODES: { value: 'all' | 'tag' | 'manual'; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'tag', label: 'Per tag' },
  { value: 'manual', label: 'Manuale' },
]

type Plugin = ReturnType<typeof useFieldPlugin<PluginVariantValue>>

type ProjectsHighlightItemsProps = {
  plugin: Plugin
}

function asItems(value: PluginVariantValue['items'] | undefined): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.length > 0) : []
}

function highlightMode(
  mode: PluginVariantValue['selection_mode'] | undefined,
): 'all' | 'tag' | 'manual' {
  if (mode === 'tag' || mode === 'manual') return mode
  return 'all'
}

function highlightEquals(a: PluginVariantValue, b: PluginVariantValue): boolean {
  return (
    highlightMode(a.selection_mode) === highlightMode(b.selection_mode) &&
    (a.tag ?? '') === (b.tag ?? '') &&
    asItems(a.items).join(',') === asItems(b.items).join(',')
  )
}

export function ProjectsHighlightItems({ plugin }: ProjectsHighlightItemsProps) {
  const remote = plugin.data?.content ?? EMPTY_PROJECTS_HIGHLIGHT_VALUE
  const [draft, setDraft] = useState<PluginVariantValue | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const lastSentRef = useRef('')

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<StoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = plugin.data?.options ?? {}
  const cdnToken = options.cdn_token || import.meta.env.VITE_STORYBLOK_CDN_TOKEN || ''
  const locale = localeFromPluginStory(plugin.data?.story)
  const value = draft ?? remote
  const items = asItems(value.items)
  const selectionMode = highlightMode(value.selection_mode)

  useEffect(() => {
    const current = draftRef.current
    if (!current || !highlightEquals(current, remote)) return
    const timeout = window.setTimeout(() => setDraft(null), 400)
    return () => window.clearTimeout(timeout)
  }, [remote.selection_mode, remote.tag, remote.context, remote.variant, remote.items])

  const setContent = (patch: Partial<PluginVariantValue> & Pick<PluginVariantValue, 'selection_mode'>) => {
    const selection_mode = highlightMode(patch.selection_mode)
    // Stesso schema di CarouselItems / ListingItems: si patcha value, non si sostituisce l'oggetto.
    const payload: PluginVariantValue = {
      ...value,
      variant: 'progetto',
      selection_mode,
      tag: selection_mode === 'tag' ? patch.tag ?? value.tag ?? '' : '',
      items: selection_mode === 'manual' ? asItems(patch.items) : [],
      context: 'projects_highlight',
    }
    if (highlightEquals(payload, value)) return
    const serialized = JSON.stringify(payload)
    if (serialized === lastSentRef.current) return
    lastSentRef.current = serialized
    setDraft(payload)
    void plugin.actions?.setContent(payload)
  }

  const handleModeChange = (selection_mode: 'all' | 'tag' | 'manual') => {
    if (selection_mode === selectionMode) return
    setContent({
      selection_mode,
      tag: selection_mode === 'tag' ? value.tag ?? '' : '',
      items: [],
    })
    setResults([])
    setSearch('')
  }

  const toggleItem = (story: StoryOption) => {
    const selected = items.includes(story.uuid)
    setContent({
      selection_mode: 'manual',
      items: selected ? items.filter((id) => id !== story.uuid) : [...items, story.uuid],
    })
  }

  const showPicker = selectionMode === 'manual'

  useEffect(() => {
    if (plugin.type !== 'loaded' || !showPicker) {
      setResults((prev) => (prev.length === 0 ? prev : []))
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const stories = await searchStories('progetto', cdnToken, search, locale)
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
  }, [plugin.type, showPicker, cdnToken, search, locale])

  if (!cdnToken) {
    return (
      <p className="listing-items__error">
        Configura cdn_token nelle opzioni del plugin.
      </p>
    )
  }

  return (
    <div className="listing-items">
      <fieldset className="listing-items__fieldset">
        <legend className="listing-items__label">Modalità</legend>
        {MODES.map((mode) => (
          <label key={mode.value} className="listing-items__radio">
            <input
              type="radio"
              name="projects-highlight-mode"
              checked={selectionMode === mode.value}
              onChange={() => handleModeChange(mode.value)}
            />
            {mode.label}
          </label>
        ))}
        <p className="listing-items__hint">
          I progetti sono sempre ordinati per ultimi aggiunti.
        </p>
      </fieldset>

      {selectionMode === 'tag' && (
        <div className="listing-items__field">
          <label className="listing-items__label" htmlFor="projects-highlight-tag">
            Tag / divisione
          </label>
          <select
            id="projects-highlight-tag"
            className="listing-items__select"
            value={value.tag ?? ''}
            onChange={(e) =>
              setContent({
                selection_mode: 'tag',
                tag: e.target.value as ProjectDivision | '',
              })
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
            <label className="listing-items__label" htmlFor="projects-highlight-search">
              Cerca progetti
            </label>
            <input
              id="projects-highlight-search"
              className="listing-items__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome story..."
            />
          </div>
          {results.length > 0 && (
            <p className="listing-items__count">{items.length} selezionati</p>
          )}
        </>
      )}

      {loading && <p className="listing-items__loading">Ricerca in corso...</p>}
      {error && <p className="listing-items__error">{error}</p>}

      {showPicker && results.length > 0 && (
        <div className="listing-items__results">
          {results.map((story) => {
            const selected = items.includes(story.uuid)
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

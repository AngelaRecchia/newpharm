import { useEffect, useMemo, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import {
  fetchInsectFamilyStories,
  fetchInsectStories,
  localeFromPluginStory,
} from '../../lib/stories'
import { validateContent } from '../../lib/validateContent'
import {
  type FamilyOption,
  type InsectOption,
  type TargetPestsPluginItem,
  type TargetPestsPluginValue,
} from '../../types'
import './target-pests.css'

function itemKey(item: TargetPestsPluginItem): string {
  return `${item.kind}:${item.uuid}`
}

export function TargetPests() {
  const plugin = useFieldPlugin<TargetPestsPluginValue>({ validateContent })
  const [families, setFamilies] = useState<FamilyOption[]>([])
  const [insects, setInsects] = useState<InsectOption[]>([])
  const [familySearch, setFamilySearch] = useState('')
  const [insectSearch, setInsectSearch] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<FamilyOption | null>(null)
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

    Promise.all([
      fetchInsectFamilyStories(cdnToken, locale),
      fetchInsectStories(cdnToken, locale),
    ])
      .then(([familyList, insectList]) => {
        if (!cancelled) {
          setFamilies(familyList)
          setInsects(insectList)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Errore caricamento catalogo')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [plugin.type, cdnToken, locale])

  const selectedInsectUuids = useMemo(
    () =>
      new Set(
        value.items.filter((item) => item.kind === 'insect').map((item) => item.uuid),
      ),
    [value.items],
  )

  const selectedFamilyOnlyUuids = useMemo(
    () =>
      new Set(
        value.items.filter((item) => item.kind === 'family').map((item) => item.uuid),
      ),
    [value.items],
  )

  const familiesByUuid = useMemo(
    () => new Map(families.map((family) => [family.uuid, family])),
    [families],
  )

  const insectsByUuid = useMemo(
    () => new Map(insects.map((insect) => [insect.uuid, insect])),
    [insects],
  )

  const selectableFamilies = useMemo(() => {
    const query = familySearch.trim().toLowerCase()
    return families.filter((family) => {
      if (!query) return true
      return family.name.toLowerCase().includes(query)
    })
  }, [families, familySearch])

  const insectsForSelectedFamily = useMemo(() => {
    if (!selectedFamily) return []
    return insects.filter((insect) => insect.familyUuid === selectedFamily.uuid)
  }, [insects, selectedFamily])

  const selectableInsects = useMemo(() => {
    const query = insectSearch.trim().toLowerCase()
    return insectsForSelectedFamily.filter((insect) => {
      if (selectedInsectUuids.has(insect.uuid)) return false
      if (!query) return true
      return insect.name.toLowerCase().includes(query)
    })
  }, [insectsForSelectedFamily, insectSearch, selectedInsectUuids])

  const canAddWholeFamily =
    selectedFamily !== null && !selectedFamilyOnlyUuids.has(selectedFamily.uuid)

  const addFamilyOnly = (family: FamilyOption) => {
    if (selectedFamilyOnlyUuids.has(family.uuid)) return
    setContent({
      items: [...value.items, { kind: 'family', uuid: family.uuid }],
    })
    setSelectedFamily(null)
    setFamilySearch('')
    setInsectSearch('')
  }

  const addInsect = (insect: InsectOption) => {
    if (selectedInsectUuids.has(insect.uuid)) return
    setContent({
      items: [...value.items, { kind: 'insect', uuid: insect.uuid }],
    })
    setInsectSearch('')
  }

  const removeItem = (item: TargetPestsPluginItem) => {
    const key = itemKey(item)
    setContent({
      items: value.items.filter((entry) => itemKey(entry) !== key),
    })
  }

  const moveItem = (item: TargetPestsPluginItem, direction: -1 | 1) => {
    const key = itemKey(item)
    const index = value.items.findIndex((entry) => itemKey(entry) === key)
    const next = index + direction
    if (index < 0 || next < 0 || next >= value.items.length) return
    const items = [...value.items]
    const [moved] = items.splice(index, 1)
    items.splice(next, 0, moved)
    setContent({ items })
  }

  const labelForItem = (item: TargetPestsPluginItem): string => {
    if (item.kind === 'family') {
      return familiesByUuid.get(item.uuid)?.name ?? item.uuid
    }
    const insect = insectsByUuid.get(item.uuid)
    const familyName =
      insect?.familyUuid != null
        ? familiesByUuid.get(insect.familyUuid)?.name
        : undefined
    const insectName = insect?.name ?? item.uuid
    return familyName ? `${insectName} · ${familyName}` : insectName
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
          {value.items.map((item: TargetPestsPluginItem, index: number) => (
            <li key={itemKey(item)} className="target-pests__row">
              <div className="target-pests__row-head">
                <div className="target-pests__row-label">
                  {item.kind === 'family' ? (
                    <span className="target-pests__badge">Famiglia</span>
                  ) : null}
                  <strong>{labelForItem(item)}</strong>
                </div>
                <div className="target-pests__actions">
                  <button
                    type="button"
                    className="target-pests__icon"
                    disabled={index === 0}
                    onClick={() => moveItem(item, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="target-pests__icon"
                    disabled={index === value.items.length - 1}
                    onClick={() => moveItem(item, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="target-pests__remove"
                    onClick={() => removeItem(item)}
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="target-pests__hint">Nessun target bersaglio selezionato.</p>
      )}

      <div className="target-pests__add">
        <p className="target-pests__section-title">Aggiungi target</p>

        {!selectedFamily ? (
          <>
            <div className="target-pests__field">
              <label className="target-pests__label" htmlFor="target-pests-family-search">
                1. Famiglia infestante
              </label>
              <input
                id="target-pests-family-search"
                className="target-pests__input"
                value={familySearch}
                onChange={(event) => setFamilySearch(event.target.value)}
                placeholder="Cerca famiglia..."
              />
            </div>
            {loading && (
              <p className="target-pests__loading">Caricamento catalogo...</p>
            )}
            {error && <p className="target-pests__error">{error}</p>}
            {selectableFamilies.length > 0 && (
              <ul className="target-pests__family-list">
                {selectableFamilies.map((family) => {
                  const alreadyAdded = selectedFamilyOnlyUuids.has(family.uuid)
                  return (
                    <li key={family.uuid} className="target-pests__family-row">
                      <button
                        type="button"
                        className="target-pests__result target-pests__result--grow"
                        onClick={() => {
                          setSelectedFamily(family)
                          setFamilySearch('')
                          setInsectSearch('')
                        }}
                      >
                        {family.name}
                        <span className="target-pests__result-meta">
                          Scegli specie (opzionale)
                        </span>
                      </button>
                      <button
                        type="button"
                        className="target-pests__secondary"
                        disabled={alreadyAdded}
                        onClick={() => addFamilyOnly(family)}
                      >
                        {alreadyAdded ? 'Già aggiunta' : 'Aggiungi famiglia'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {!loading && families.length > 0 && selectableFamilies.length === 0 && (
              <p className="target-pests__hint">Nessuna famiglia corrisponde alla ricerca.</p>
            )}
          </>
        ) : (
          <>
            <div className="target-pests__family-bar">
              <span className="target-pests__family-current">
                Famiglia: <strong>{selectedFamily.name}</strong>
              </span>
              <button
                type="button"
                className="target-pests__link"
                onClick={() => {
                  setSelectedFamily(null)
                  setInsectSearch('')
                }}
              >
                Cambia famiglia
              </button>
            </div>

            <div className="target-pests__family-actions">
              {canAddWholeFamily ? (
                <button
                  type="button"
                  className="target-pests__primary"
                  onClick={() => addFamilyOnly(selectedFamily)}
                >
                  Aggiungi tutta la famiglia
                </button>
              ) : (
                <p className="target-pests__hint">
                  Questa famiglia è già presente come target generico.
                </p>
              )}
              <button
                type="button"
                className="target-pests__secondary"
                onClick={() => {
                  setSelectedFamily(null)
                  setInsectSearch('')
                }}
              >
                Aggiungi un&apos;altra famiglia
              </button>
            </div>

            <div className="target-pests__field">
              <label className="target-pests__label" htmlFor="target-pests-insect-search">
                2. Infestante (opzionale)
              </label>
              <input
                id="target-pests-insect-search"
                className="target-pests__input"
                value={insectSearch}
                onChange={(event) => setInsectSearch(event.target.value)}
                placeholder="Cerca specie in questa famiglia..."
              />
            </div>

            {selectableInsects.length > 0 && (
              <div className="target-pests__results">
                {selectableInsects.map((insect) => (
                  <button
                    key={insect.uuid}
                    type="button"
                    className="target-pests__result"
                    onClick={() => addInsect(insect)}
                  >
                    {insect.name}
                  </button>
                ))}
              </div>
            )}

            {!loading &&
              insectsForSelectedFamily.length === 0 && (
                <p className="target-pests__hint">
                  Nessun infestante collegato a questa famiglia nel catalogo.
                </p>
              )}

            {!loading &&
              insectsForSelectedFamily.length > 0 &&
              selectableInsects.length === 0 &&
              insectSearch.trim() === '' &&
              insectsForSelectedFamily.every((insect) =>
                selectedInsectUuids.has(insect.uuid),
              ) && (
                <p className="target-pests__hint">
                  Tutte le specie di questa famiglia sono già state aggiunte.
                </p>
              )}
          </>
        )}
      </div>
    </div>
  )
}

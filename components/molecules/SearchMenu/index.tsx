'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/lib/use-debounce'
import Icon from '@/components/atoms/Icon'
import SmartLink from '@/components/atoms/SmartLink'
import Button from '@/components/atoms/Button'
import { getLinkUrl, getFirstValidLink } from '@/lib/api/utils/links'
import { motion, AnimatePresence } from 'motion/react'
import FilterChip from '@/components/atoms/FilterChip'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type SearchResultItem = {
  uuid: string
  title: string
  href: string
}

type SearchResults = {
  projects: SearchResultItem[]
  products: SearchResultItem[]
  stories: SearchResultItem[]
  downloadables: SearchResultItem[]
}

const EMPTY_RESULTS: SearchResults = {
  projects: [],
  products: [],
  stories: [],
  downloadables: [],
}

const PREVIEW_LIMIT = 8

interface SearchMenuProps {
  isOpen: boolean
  onClose: () => void
  searchPage?:
    | (import('@/lib/api/utils/links').StoryblokLink & { anchor?: string })
    | import('@/types/storyblok').LinkStoryblok
    | import('@/types/storyblok').LinkStoryblok[]
    | null
  suggestedSearches?: string[] | null
}

export default function SearchMenu({
  isOpen,
  onClose,
  searchPage,
  suggestedSearches: suggestedSearchesProp,
}: SearchMenuProps) {
  const t = useTranslations('')
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || ''
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const suggestedSearches = suggestedSearchesProp ?? null

  const debouncedQuery = useDebounce(query, 250)

  const performSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setResults(EMPTY_RESULTS)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: term.trim(),
          ...(locale ? { locale } : {}),
          limit: String(PREVIEW_LIMIT),
        })
        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults(data.results ?? EMPTY_RESULTS)
      } catch (error) {
        console.error('[SearchMenu] error:', error)
        setResults(EMPTY_RESULTS)
      } finally {
        setLoading(false)
      }
    },
    [locale],
  )

  useEffect(() => {
    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    let isClickFromToggle = false

    const handlePointerDown = (event: PointerEvent) => {
      isClickFromToggle = false
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (isClickFromToggle) {
        isClickFromToggle = false
        return
      }
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (isOpen) {
      setQuery('')
      setResults(EMPTY_RESULTS)

      // Focus senza scrollare la pagina, dopo l'animazione di apertura
      timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true })
      }, 250)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    router.push(`${searchPageBaseUrl}?q=${encodeURIComponent(term)}`)
    onClose()
  }

  const handleChipClick = (term: string) => {
    setQuery(term)
    router.push(`${searchPageBaseUrl}?q=${encodeURIComponent(term)}`)
    onClose()
  }

  const hasResults = useMemo(
    () => Object.values(results).some((group) => group.length > 0),
    [results],
  )

  const searchPageBaseUrl = useMemo(() => {
    if (!searchPage) return '/cerca'

    let link = searchPage as any
    if (Array.isArray(link)) {
      const first = getFirstValidLink(link)
      link = first?.link ?? first
    } else if ('label' in link && 'link' in link) {
      link = link.link
    }

    const url = getLinkUrl(link)
    return url || '/cerca'
  }, [searchPage])

  const allResultsHref = `${searchPageBaseUrl}${query ? `?q=${encodeURIComponent(query.trim())}` : ''}`

  const sections: { key: keyof SearchResults; label: string }[] = [
    { key: 'projects', label: t('search_solutions') },
    { key: 'products', label: t('search_products') },
    { key: 'stories', label: t('search_stories') },
    { key: 'downloadables', label: t('search_downloads') },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={wrapperRef}
          className={cn('wrapper')}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cn('inner')}>
            <div className={cn('content')}>
        <form className={cn('form')} onSubmit={handleSubmit} role="search">
          <div className={cn('inputWrapper')}>
            <input
              ref={inputRef}
              id="header-search"
              type="search"
              className={cn('input')}
              placeholder={t('cerca_per')}
              aria-label={t('cerca_per')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className={cn('clear')}
                onClick={() => setQuery('')}
                aria-label={t('clear_search')}
              >
                <Icon type="close" size="s" />
              </button>
            )}
          </div>
        </form>

        {!query.trim() && suggestedSearches && suggestedSearches.length > 0 && (
          <div className={cn('suggested')}>
            <span className={cn('suggestedLabel')}>{t('most_searched')}</span>
            <div className={cn('chips')}>
              {suggestedSearches.map((term) => (
                <FilterChip
                  key={term}
                  label={term}
                  size="small"
                  onClick={() => handleChipClick(term)}
                />
              ))}
            </div>
          </div>
        )}

        {loading && <div className={cn('loading')}>{t('loading')}</div>}

        {!loading && debouncedQuery.trim() && !hasResults && (
          <div className={cn('empty')}>{t('search_no_results')}</div>
        )}

        {!loading && hasResults && (
          <div className={cn('results')}>
            {sections.map(({ key, label }) => {
              const items = results[key]
              if (items.length === 0) return null

              return (
                <div key={key} className={cn('section')}>
                  <h2 className={cn('sectionTitle')}>{label}</h2>
                  <ul className={cn('list')}>
                    {items.slice(0, PREVIEW_LIMIT).map((item) => (
                      <li key={item.uuid}>
                        <SmartLink
                          href={item.href}
                          className={cn('item')}
                          onClick={onClose}
                        >
                          {item.title}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}

            <div className={cn('footer')}>
              <SmartLink href={allResultsHref}>
                <Button label={t('all_results')} variant="secondary" inert />
              </SmartLink>
            </div>
          </div>
        )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

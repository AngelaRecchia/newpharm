'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/lib/use-debounce'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { getTabPanelMotion } from '@/lib/animation/gridPresence'
import Container from '@/components/atoms/Container'
import Icon from '@/components/atoms/Icon'
import FilterChip from '@/components/atoms/FilterChip'
import Button from '@/components/atoms/Button'
import CardListing from '@/components/molecules/CardListing'
import ChipSwiper, { ChipSwiperSlide } from '@/components/molecules/ChipSwiper'
import FilterChips from '@/components/molecules/FilterChips'
import PaginationNumbers from '@/components/molecules/PaginationNumbers'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const PREVIEW_LIMIT = 8
const PAGE_SIZE = 16
const SEARCH_HITS_PER_TYPE = 100

type SearchResultItem = {
  uuid: string
  title: string
  subtitle?: string
  href: string
  image?: any
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

interface SearchProps {
  title?: string | null
  subtitle?: string | null
  suggestedSearches?: string[] | null
}

function SuggestedChips({
  terms,
  onClick,
}: {
  terms: string[]
  onClick: (term: string) => void
}) {
  return (
    <ChipSwiper size="s" className={cn('suggestedTrack')}>
      {terms.map((term) => (
        <ChipSwiperSlide key={term}>
          <FilterChip label={term} size="s" onClick={() => onClick(term)} />
        </ChipSwiperSlide>
      ))}
    </ChipSwiper>
  )
}

export default function Search({ title, subtitle, suggestedSearches }: SearchProps) {
  const t = useTranslations('')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = (params?.locale as string) || ''
  const initialQuery = searchParams?.get('q') ?? ''
  const initialType = (searchParams?.get('type') as keyof SearchResults | null) ?? null

  const [query, setQuery] = useState(initialQuery)
  const [selectedType, setSelectedType] = useState<keyof SearchResults | null>(initialType)
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const skipScrollRefresh = useRef(true)
  const reduceMotion = useReducedMotion()
  const refreshPageScroll = useRefreshPageScroll()

  const debouncedQuery = useDebounce(query, 250)

  const performSearch = useCallback(
    async (term: string) => {
      const trimmedTerm = term.trim()
      if (!trimmedTerm || trimmedTerm.length < 2) {
        setResults(EMPTY_RESULTS)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: trimmedTerm,
          ...(locale ? { locale } : {}),
          limit: String(SEARCH_HITS_PER_TYPE),
        })
        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults(data.results ?? EMPTY_RESULTS)
      } catch (error) {
        console.error('[Search] error:', error)
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

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery, selectedType])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }

    refreshPageScroll()
  }, [currentPage, refreshPageScroll, results, selectedType])

  const updateUrl = useCallback(
    (nextQuery: string, nextType: keyof SearchResults | null) => {
      const params = new URLSearchParams()
      const trimmedQuery = nextQuery.trim()
      if (trimmedQuery) params.set('q', trimmedQuery)
      if (nextType) params.set('type', nextType)
      const queryString = params.toString()
      router.push(queryString ? `?${queryString}` : '?', { scroll: false })
    },
    [router],
  )

  const hasResults = useMemo(
    () => Object.values(results).some((group) => group.length > 0),
    [results]
  )

  const totalCount = useMemo(
    () => Object.values(results).reduce((sum, group) => sum + group.length, 0),
    [results]
  )

  const visibleCount = selectedType ? results[selectedType].length : totalCount

  const sections: { key: keyof SearchResults; label: string }[] = [
    { key: 'projects', label: t('search_solutions') },
    { key: 'products', label: t('search_products') },
    { key: 'stories', label: t('search_stories') },
    { key: 'downloadables', label: t('search_downloads') },
  ]

  const availableSections = sections.filter(({ key }) => results[key].length > 0)
  const availableSectionKeys = availableSections.map(({ key }) => key)
  const sectionLabels = useMemo(
    () =>
      Object.fromEntries(sections.map(({ key, label }) => [key, label])) as Record<
        keyof SearchResults,
        string
      >,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  const handleClear = () => {
    setQuery('')
    setSelectedType(null)
    updateUrl('', null)
    inputRef.current?.focus()
  }

  const handleKindsChange = useCallback(
    (next: Array<keyof SearchResults>) => {
      const nextType = next[0] ?? null
      setSelectedType(nextType)
      setCurrentPage(1)
      updateUrl(query, nextType)
    },
    [query, updateUrl],
  )

  const handleShowAll = (key: keyof SearchResults) => {
    setSelectedType(key)
    setCurrentPage(1)
    updateUrl(query, key)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    updateUrl(value, selectedType)
  }

  const handleSuggestedClick = (term: string) => {
    setQuery(term)
    setSelectedType(null)
    setCurrentPage(1)
    updateUrl(term, null)
  }

  const renderCard = (item: SearchResultItem, key: keyof SearchResults) => (
    <CardListing
      key={item.uuid}
      title={item.title}
      description={item.subtitle}
      image={item.image}
      href={item.href}
      showDownload={key === 'downloadables'}
      imageSafeArea={key === 'products'}
      productTransitionId={key === 'products' ? item.uuid : undefined}
      placeholderWhenNoImage
    />
  )

  const selectedTypeItems = selectedType ? results[selectedType] : []
  const selectedTypeTotalPages = Math.max(
    1,
    Math.ceil(selectedTypeItems.length / PAGE_SIZE),
  )
  const selectedTypePageItems = selectedType
    ? selectedTypeItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : []

  return (
    <section className={cn('wrapper', { hasQuery: query.trim().length > 0 })}>
      <Container>
        {(title || subtitle) && !query.trim() && (
          <div className={cn('pageHeader')}>
            {title && <h1 className={cn('pageTitle')}>{title}</h1>}
            {subtitle && <p className={cn('pageSubtitle')}>{subtitle}</p>}
          </div>
        )}

        {!query.trim() && (
          <div className={cn('emptyState')}>
            <form className={cn('searchForm')} onSubmit={(e) => e.preventDefault()} role="search">
              <div className={cn('inputWrapper')}>
                <input
                  ref={inputRef}
                  type="search"
                  className={cn('searchInput')}
                  placeholder={t('search_placeholder')}
                  aria-label={t('search_placeholder')}
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className={cn('inputClear')}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClear()
                    }}
                    aria-label={t('clear_search')}
                  >
                    <Icon type="close" size="s" />
                  </button>
                )}
              </div>
            </form>

            {suggestedSearches && suggestedSearches.length > 0 && (
              <div className={cn('suggested')}>
                <span className={cn('suggestedLabel')}>{t('most_searched')}</span>
                <div className={cn('chipsWrapper')}>
                  <SuggestedChips terms={suggestedSearches} onClick={handleSuggestedClick} />
                </div>
              </div>
            )}
          </div>
        )}

        {query.trim() && (
          <div className={cn('header')}>
            <div className={cn('headerMain')}>
              <span className={cn('countLabel')}>
                {t.rich('search_results_for', {
                  count: visibleCount,
                  b: (chunks) => (
                    <strong className={cn('countNumber')}>
                      {Array.isArray(chunks)
                        ? chunks.map((chunk, index) => <span key={index}>{chunk}</span>)
                        : chunks}
                    </strong>
                  ),
                })}
              </span>
              <form className={cn('searchForm')} onSubmit={(e) => e.preventDefault()} role="search">
                <div className={cn('inputWrapper')}>
                  <input
                    ref={inputRef}
                    type="search"
                    className={cn('searchInput')}
                    placeholder={t('search_placeholder')}
                    aria-label={t('search_placeholder')}
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      className={cn('inputClear')}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClear()
                      }}
                      aria-label={t('clear_search')}
                    >
                      <Icon type="close" size="s" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {!loading && hasResults && (
          <div className={cn('tabsWrapper')}>
            <FilterChips
              items={availableSectionKeys}
              value={selectedType ? [selectedType] : []}
              onChange={handleKindsChange}
              size="s"
              exclusive
              ariaLabel={t('search_all')}
              getLabel={(key) => sectionLabels[key]}
            />
          </div>
        )}

        {loading && <div className={cn('loading')}>{t('loading')}</div>}

        {!loading && debouncedQuery.trim().length >= 2 && !hasResults && (
          <div className={cn('noResults')}>
            <Icon type="info" size="m" className={cn('noResultsIcon')} />
            <p className={cn('noResultsText')}>{t('search_no_results_hint')}</p>
          </div>
        )}

        {!loading && hasResults && (
          <AnimatePresence mode="wait" initial={false} onExitComplete={refreshPageScroll}>
            <motion.div
              key={selectedType ?? 'all'}
              className={cn('results')}
              {...getTabPanelMotion(reduceMotion)}
            >
              {selectedType ? (
                <div className={cn('section')}>
                  <h3 className={cn('sectionTitle')}>
                    {sections.find(({ key }) => key === selectedType)?.label}
                  </h3>
                  <div className={cn('grid')}>
                    {selectedTypePageItems.map((item) => renderCard(item, selectedType))}
                  </div>
                  {selectedTypeTotalPages > 1 && (
                    <div className={cn('paginationFooter')}>
                      <PaginationNumbers
                        currentPage={currentPage}
                        totalPages={selectedTypeTotalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              ) : (
                sections.map(({ key, label }) => {
                  const items = results[key]
                  if (items.length === 0) return null
                  const previewItems = items.slice(0, PREVIEW_LIMIT)
                  const hasMore = items.length > PREVIEW_LIMIT
                  return (
                    <div key={key} className={cn('section')}>
                      <h3 className={cn('sectionTitle')}>{label}</h3>
                      <div className={cn('grid')}>
                        {previewItems.map((item) => renderCard(item, key))}
                      </div>
                      {hasMore && (
                        <div className={cn('sectionFooter')}>
                          <Button
                            label={t('show_all')}
                            variant="secondary"
                            size="small"
                            onClick={() => handleShowAll(key)}
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </section>
  )
}

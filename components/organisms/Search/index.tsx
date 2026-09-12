'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/lib/use-debounce'
import Container from '@/components/atoms/Container'
import Icon from '@/components/atoms/Icon'
import CardListing from '@/components/molecules/CardListing'
import FilterChip from '@/components/atoms/FilterChip'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

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

export default function Search({ title, subtitle, suggestedSearches }: SearchProps) {
  const t = useTranslations('')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = (params?.locale as string) || ''
  const initialQuery = searchParams?.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)

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
          limit: '50',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    router.push(`?q=${encodeURIComponent(term)}`, { scroll: false })
  }

  const handleChipClick = (term: string) => {
    setQuery(term)
    router.push(`?q=${encodeURIComponent(term)}`, { scroll: false })
  }

  const hasResults = useMemo(
    () => Object.values(results).some((group) => group.length > 0),
    [results]
  )

  const sections: { key: keyof SearchResults; label: string }[] = [
    { key: 'projects', label: t('search_solutions') },
    { key: 'products', label: t('search_products') },
    { key: 'stories', label: t('search_stories') },
    { key: 'downloadables', label: t('search_downloads') },
  ]

  return (
    <section className={cn('wrapper')}>
      <Container>
        <div className={cn('header')}>
          {title && <h1 className={cn('title')}>{title}</h1>}
          {subtitle && <p className={cn('subtitle')}>{subtitle}</p>}

          <form className={cn('form')} onSubmit={handleSubmit} role="search">
            <div className={cn('inputWrapper')}>
              <Icon type="search" size="m" />
              <input
                type="search"
                className={cn('input')}
                placeholder={t('search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
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

          {suggestedSearches && suggestedSearches.length > 0 && (
            <div className={cn('chips')}>
              <span className={cn('chipsLabel')}>{t('most_searched')}</span>
              <div className={cn('chipsTrack')}>
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
        </div>

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
                  <div className={cn('grid')}>
                    {items.map((item) => (
                      <CardListing
                        key={item.uuid}
                        title={item.title}
                        description={item.subtitle}
                        image={item.image}
                        href={item.href}
                        showDownload={key === 'downloadables'}
                        imageSafeArea={key === 'products'}
                        placeholderWhenNoImage
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </section>
  )
}

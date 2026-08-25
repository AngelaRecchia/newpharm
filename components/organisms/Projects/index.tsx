'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Container from '@/components/atoms/Container'
import CardListing from '@/components/molecules/CardListing'
import DivisionFilters from '@/components/molecules/DivisionFilters'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { mapStoryToCard } from '@/lib/listing/mapStoryToCard'
import { filterProjectsByDivisions } from '@/lib/projects/filterProjects'
import { useProjectDivisionFilterUrl } from '@/lib/projects/useProjectDivisionFilterUrl'
import type { ProjectDivision } from '@/lib/projects/divisions'
import type { ProjectsStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)
const INITIAL_COUNT = 16
const LOAD_MORE_STEP = 16

function ProjectsInner({ blok }: { blok?: ProjectsStoryblok }) {
  const t = useTranslations('')
  const refreshPageScroll = useRefreshPageScroll()
  const skipScrollRefresh = useRef(true)
  const { divisions, setDivisions } = useProjectDivisionFilterUrl()
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const divisionsKey = divisions.join(',')

  const resolvedItems = blok?.resolved_items ?? []
  const filteredItems = useMemo(
    () => filterProjectsByDivisions(resolvedItems, divisions),
    [resolvedItems, divisions],
  )

  const cards = useMemo(
    () => filteredItems.map((story) => mapStoryToCard(story, 'project')),
    [filteredItems],
  )

  const visibleItems = cards.slice(0, visibleCount)
  const hasMore = visibleCount < cards.length

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, cards.length))
  }, [cards.length])

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [divisionsKey])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [visibleCount, divisionsKey, cards.length, refreshPageScroll])

  const handleDivisionsChange = useCallback(
    (next: ProjectDivision[]) => {
      setDivisions(next)
      setVisibleCount(INITIAL_COUNT)
    },
    [setDivisions],
  )

  if (!blok) return null

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as any)}
    >
      <Container className={cn('content')} flushBlock>
        {(blok.title || blok.subtitle) ? (
          <header className={cn('head')}>
            {blok.title ? <h1 className={cn('title')}>{blok.title}</h1> : null}
            {blok.subtitle ? <p className={cn('subtitle')}>{blok.subtitle}</p> : null}
          </header>
        ) : null}

        <DivisionFilters
          dark
          value={divisions}
          onChange={handleDivisionsChange}
        />

        {visibleItems.length > 0 ? (
          <div className={cn('grid')}>
            {visibleItems.map((card, index) => (
              <CardListing
                key={`${card.href ?? card.title}-${index}`}
                title={card.title}
                description={card.description}
                image={card.image}
                href={card.href}
                dark
                imageRatio="square"
              />
            ))}
          </div>
        ) : (
          <p className={cn('empty')}>
            Nessun progetto trovato con i filtri selezionati.
          </p>
        )}

        {hasMore ? (
          <div className={cn('footer')}>
            <Button
              icon="chevron-down"
              label={t('load_more')}
              variant="secondary"
              size="small"
              onClick={loadMore}
            />
          </div>
        ) : null}
      </Container>
    </section>
  )
}

export default function Projects({ blok }: { blok?: ProjectsStoryblok }) {
  return (
    <Suspense fallback={null}>
      <ProjectsInner blok={blok} />
    </Suspense>
  )
}

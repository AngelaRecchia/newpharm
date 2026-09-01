'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Container from '@/components/atoms/Container'
import HeroTertiary from '@/components/molecules/HeroTertiary'
import CardListing from '@/components/molecules/CardListing'
import DivisionFilters from '@/components/molecules/DivisionFilters'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { getEmptyMotion, getGridMotion } from '@/lib/animation/gridPresence'
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
  const reduceMotion = useReducedMotion()
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

  const handleGridExitComplete = useCallback(() => {
    refreshPageScroll()
  }, [refreshPageScroll])

  if (!blok) return null

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as any)}
    >
      <Container className={cn('content')} flushBlock>
        {(blok.title || blok.subtitle) ? (
          <div className={cn('head')}>
            <HeroTertiary title={blok.title} subtitle={blok.subtitle} as="h1" />
          </div>
        ) : null}

        <DivisionFilters
          dark
          value={divisions}
          onChange={handleDivisionsChange}
        />

        {visibleItems.length > 0 ? (
          <div className={cn('grid')}>
            <AnimatePresence
              mode="popLayout"
              initial={false}
              onExitComplete={handleGridExitComplete}
            >
              {visibleItems.map((card, index) => (
                <motion.div
                  key={card.uuid ?? card.href ?? card.title}
                  className={cn('gridItem')}
                  {...getGridMotion(index, reduceMotion)}
                >
                  <CardListing
                    title={card.title}
                    description={card.description}
                    image={card.image}
                    href={card.href}
                    dark
                    imageRatio="square"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key="empty"
              className={cn('empty')}
              {...getEmptyMotion(reduceMotion)}
            >
              Nessun progetto trovato con i filtri selezionati.
            </motion.p>
          </AnimatePresence>
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

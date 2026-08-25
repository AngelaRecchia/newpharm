'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import { useFormatter, useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Container from '@/components/atoms/Container'
import CardNews from '@/components/molecules/CardNews'
import FilterChips from '@/components/molecules/FilterChips'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { mapStoryToNewsCard, sortStoriesByDate } from '@/lib/carousel/mapStoryToNewsCard'
import { filterStoriesByTags } from '@/lib/stories/filterStories'
import { STORY_TAGS, type StoryTag } from '@/lib/stories/tags'
import { MOSAIC_CYCLE, groupMosaicItems, type MosaicSlot } from '@/lib/stories/mosaic'
import { useStoryTagFilterUrl } from '@/lib/stories/useStoryTagFilterUrl'
import type { RelatedStory } from '@/lib/api/storyblok/stories'
import type { StoriesStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)
const INITIAL_COUNT = MOSAIC_CYCLE
const LOAD_MORE_STEP = MOSAIC_CYCLE
const GRID_EASE = [0.4, 0, 0.2, 1] as const
const GRID_STAGGER = 0.04

function getGridMotion(index: number, reduceMotion: boolean | null) {
  const delay = reduceMotion ? 0 : (index % MOSAIC_CYCLE) * GRID_STAGGER
  const duration = reduceMotion ? 0.01 : 0.35

  return {
    layout: !reduceMotion,
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        opacity: { duration, ease: GRID_EASE, delay },
        y: { duration, ease: GRID_EASE, delay },
      },
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : -8,
      transition: {
        duration: reduceMotion ? 0.01 : 0.2,
        ease: GRID_EASE,
      },
    },
    transition: {
      layout: {
        duration: reduceMotion ? 0.01 : 0.4,
        ease: GRID_EASE,
      },
    },
  } as const
}

function StoryNewsCard({
  item,
  slot,
  date,
}: {
  item: RelatedStory
  slot: MosaicSlot
  date: string
}) {
  const image = item.asset?.length > 0 && item.asset[0] ? item.asset[0] : null
  const itemTags = item.tag
    ? typeof item.tag === 'string'
      ? [item.tag]
      : item.tag
    : []

  return (
    <CardNews
      title={item.title || ''}
      subtitle={date}
      image={image}
      href={item.full_slug}
      tags={itemTags}
      imageRatio={slot.ratio}
    />
  )
}

function StoriesInner({ blok }: { blok?: StoriesStoryblok }) {
  const t = useTranslations('')
  const format = useFormatter()
  const refreshPageScroll = useRefreshPageScroll()
  const reduceMotion = useReducedMotion()
  const skipScrollRefresh = useRef(true)
  const { tags, setTags } = useStoryTagFilterUrl()
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const tagsKey = tags.join(',')

  const resolvedItems = blok?.resolved_items ?? []
  const filteredItems = useMemo(
    () => sortStoriesByDate(filterStoriesByTags(resolvedItems, tags)),
    [resolvedItems, tags],
  )

  const cards = useMemo(
    () => filteredItems.map(mapStoryToNewsCard),
    [filteredItems],
  )

  const visibleItems = cards.slice(0, visibleCount)
  const hasMore = visibleCount < cards.length

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, cards.length))
  }, [cards.length])

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [tagsKey])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [visibleCount, tagsKey, cards.length, refreshPageScroll])

  const formatCardDate = useCallback(
    (value: string | null) =>
      value
        ? format.dateTime(new Date(value), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '',
    [format],
  )

  const handleTagsChange = useCallback(
    (next: StoryTag[]) => {
      setTags(next)
      setVisibleCount(INITIAL_COUNT)
    },
    [setTags],
  )

  const handleGridExitComplete = useCallback(() => {
    refreshPageScroll()
  }, [refreshPageScroll])

  const renderCard = (item: RelatedStory, index: number, slot: MosaicSlot, cellClassName?: string) => (
    <motion.div
      key={item.full_slug}
      className={cellClassName}
      {...getGridMotion(index, reduceMotion)}
    >
      <StoryNewsCard item={item} slot={slot} date={formatCardDate(item.date)} />
    </motion.div>
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

        <FilterChips
          items={STORY_TAGS}
          value={tags}
          onChange={handleTagsChange}
          ariaLabel="Stories"
          size="small"
        />

        {visibleItems.length > 0 ? (
          <div className={cn('grid')}>
            <AnimatePresence
              mode="popLayout"
              initial={false}
              onExitComplete={handleGridExitComplete}
            >
              {groupMosaicItems(visibleItems).map((group) => {
                if (group.type === 'row2') {
                  return (
                    <motion.div
                      key={group.items.map(({ item }) => item.full_slug).join('|')}
                      className={cn('row2')}
                      {...getGridMotion(group.items[0].index, reduceMotion)}
                    >
                      {group.items.map(({ item, slot }, offset) => (
                        <div
                          key={item.full_slug}
                          className={cn('cell', { 'row2-wide': offset === 0 })}
                        >
                          <StoryNewsCard
                            item={item}
                            slot={slot}
                            date={formatCardDate(item.date)}
                          />
                        </div>
                      ))}
                    </motion.div>
                  )
                }

                const { item, index, slot } = group
                return renderCard(
                  item,
                  index,
                  slot,
                  cn(
                    'cell',
                    `span-${slot.tabletSpan}`,
                    `desktop-span-${slot.desktopSpan}`,
                    { 'row-span-2': slot.rowSpan === 2 },
                  ),
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key="empty"
              className={cn('empty')}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.3,
                ease: GRID_EASE,
              }}
            >
              Nessuna storia trovata con i filtri selezionati.
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

export default function Stories({ blok }: { blok?: StoriesStoryblok }) {
  return (
    <Suspense fallback={null}>
      <StoriesInner blok={blok} />
    </Suspense>
  )
}

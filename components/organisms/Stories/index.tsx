'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import { useFormatter, useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Container from '@/components/atoms/Container'
import HeroTertiary from '@/components/molecules/HeroTertiary'
import CardNews from '@/components/molecules/CardNews'
import FilterChips from '@/components/molecules/FilterChips'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { getEmptyMotion, getGridMotion } from '@/lib/animation/gridPresence'
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
      {...getGridMotion(index % MOSAIC_CYCLE, reduceMotion)}
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
          <div className={cn('head')}>
            <HeroTertiary title={blok.title} subtitle={blok.subtitle} as="h1" />
          </div>
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
                      {...getGridMotion(group.items[0].index % MOSAIC_CYCLE, reduceMotion)}
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
              {...getEmptyMotion(reduceMotion)}
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

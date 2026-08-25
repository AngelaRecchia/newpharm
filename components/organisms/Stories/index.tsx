'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
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
import { useStoryTagFilterUrl } from '@/lib/stories/useStoryTagFilterUrl'
import type { StoriesStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)
const INITIAL_COUNT = 15
const LOAD_MORE_STEP = 15

function StoriesInner({ blok }: { blok?: StoriesStoryblok }) {
  const t = useTranslations('')
  const format = useFormatter()
  const refreshPageScroll = useRefreshPageScroll()
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

  const handleTagsChange = useCallback(
    (next: StoryTag[]) => {
      setTags(next)
      setVisibleCount(INITIAL_COUNT)
    },
    [setTags],
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
        />

        {visibleItems.length > 0 ? (
          <div className={cn('grid')}>
            {visibleItems.map((item, index) => {
              const image = item.asset?.length > 0 && item.asset[0] ? item.asset[0] : null
              const itemTags = item.tag
                ? typeof item.tag === 'string'
                  ? [item.tag]
                  : item.tag
                : []
              const formattedDate = item.date
                ? format.dateTime(new Date(item.date), {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : ''

              return (
                <div key={`${item.full_slug}-${index}`} className={cn('cell')}>
                  <CardNews
                    title={item.title || ''}
                    subtitle={formattedDate}
                    image={image}
                    href={item.full_slug}
                    tags={itemTags}
                    fill
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <p className={cn('empty')}>
            Nessuna storia trovata con i filtri selezionati.
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

export default function Stories({ blok }: { blok?: StoriesStoryblok }) {
  return (
    <Suspense fallback={null}>
      <StoriesInner blok={blok} />
    </Suspense>
  )
}

'use client'

import { useMemo } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import Container from '@/components/atoms/Container'
import Icon from '@/components/atoms/Icon'
import CardJob from '@/components/molecules/CardJob'
import { mapJobToCard } from '@/lib/jobs/mapJobToCard'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import type { Job_listStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export default function JobList({ blok }: { blok?: Job_listStoryblok }) {
  const resolvedItems = blok?.resolved_items ?? []

  const cards = useMemo(
    () => resolvedItems.map((story) => mapJobToCard(story)),
    [resolvedItems],
  )

  if (!blok) return null

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as never)}
    >
      <Container className={cn('content')} flushBlock>
        {(blok.title || blok.subtitle) ? (
          <header className={cn('head')}>
            {blok.title ? <h3 className={cn('title')}>{blok.title}</h3> : null}
            {blok.subtitle ? <p className={cn('subtitle')}>{blok.subtitle}</p> : null}
          </header>
        ) : null}

        {cards.length > 0 ? (
          <div className={cn('list')}>
            {cards.map((card) => (
              <CardJob
                key={card.uuid}
                title={card.title}
                area={card.area}
                esperienza={card.esperienza}
                href={card.href}
              />
            ))}
          </div>
        ) : (
          <div className={cn('empty')} role="status">
            <p className={cn('empty-text')}>Al momento non ci sono posizioni aperte</p>
            <Icon type="info" size="l" className={cn('empty-icon')} />
          </div>
        )}
      </Container>
    </section>
  )
}

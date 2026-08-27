'use client'

import { useEffect, useMemo, useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import SmartLink from '@/components/atoms/SmartLink'
import { Projects_highlightStoryblok } from '@/types/storyblok'
import { mapStoryToCard } from '@/lib/listing/mapStoryToCard'
import { parseProjectsHighlightVariant } from '@/lib/listing/parseListingVariant'
import { filterProjectsByDivisions } from '@/lib/projects/filterProjects'
import { parseProjectDivisions } from '@/lib/projects/divisions'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import type { ListingStoryResolved, ListingVariantValue } from '@/lib/listing/types'

const cn = classNames.bind(styles)
const EMPTY_RESOLVED: ListingStoryResolved[] = []

function filterHighlightStories(
  stories: ListingStoryResolved[],
  parsed: ListingVariantValue,
): ListingStoryResolved[] {
  if (parsed.selection_mode === 'manual') {
    if (parsed.items.length === 0) return []
    const included = new Set(parsed.items)
    return stories.filter((story) => included.has(story.uuid))
  }

  if (parsed.selection_mode === 'tag') {
    if (!parsed.tag) return []
    return filterProjectsByDivisions(stories, parseProjectDivisions(parsed.tag))
  }

  return stories
}

export default function ProjectsHighlight({ blok }: { blok?: Projects_highlightStoryblok }) {
    const cardsRef = useRef<HTMLDivElement>(null)
    const refreshPageScroll = useRefreshPageScroll()
    const resolvedItems = blok?.resolved_items ?? EMPTY_RESOLVED
    const parsed = parseProjectsHighlightVariant(blok?.variant)
    const variantKey = `${parsed.selection_mode}:${parsed.tag}:${parsed.items.join(',')}`
    const cards = useMemo(
        () =>
          filterHighlightStories(resolvedItems, parsed).map((story) =>
            mapStoryToCard(story, 'project'),
          ),
        // parsed è derivato da variantKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [resolvedItems, variantKey],
    )

    useEffect(() => {
        refreshPageScroll()
    }, [cards.length, refreshPageScroll])

    useEffect(() => {
        if (!cardsRef.current || cards.length === 0) return

        const images = Array.from(cardsRef.current.querySelectorAll<HTMLElement>(`.${cn('card-image')}`))
        if (!images.length) return

        let rafId: number | null = null
        const PARALLAX = 16 // % di spostamento massimo

        const onScroll = () => {
            if (rafId !== null) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                const vh = window.innerHeight
                images.forEach((el) => {
                    const rect = el.getBoundingClientRect()
                    const progress = 1 - (rect.top + rect.height) / (vh + rect.height)
                    const clamped = Math.min(1, Math.max(0, progress))
                    const y = PARALLAX - clamped * PARALLAX * 2
                    el.style.transform = `translateY(${y}%)`
                })
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()

        return () => {
            window.removeEventListener('scroll', onScroll)
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [cards])

    if (!blok) {
        return <></>
    }

    const { title, link } = blok

    return (
        <section className={cn('wrapper')} id={getStoryblokAnchorId(blok.anchor_id)} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                {(title || link) && (
                    <div className={cn('head')}>
                        {title && <h2 className={cn('title')}>{title}</h2>}
                        {link && (
                            <div className={cn('link')}>
                                <Button link={link} />
                            </div>
                        )}
                    </div>
                )}


                {cards.length > 0 ? (
                <div ref={cardsRef} className={cn('cards')}>
                    {cards.map((card, index) => {
                        const href = card.href
                            ? card.href.startsWith('/')
                                ? card.href
                                : `/${card.href}`
                            : undefined

                        return (
                            <div key={card.uuid ?? `${card.href ?? card.title}-${index}`} className={cn('card')}>
                                {card.image && (
                                    <div className={cn('card-image')}>
                                        <Asset asset={card.image} size="l" />
                                    </div>
                                )}
                                <SmartLink href={href} className={cn('card-link')}>
                                    <div className={cn('card-text')}>{card.title}</div>
                                    {href ? (
                                        <Button className={cn('card-button')} href={href} inert={true} />
                                    ) : null}
                                </SmartLink>
                            </div>
                        )
                    })}
                </div>
                ) : null}
            </div>
        </section>
    )
}

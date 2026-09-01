'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Container from '@/components/atoms/Container'
import HeroTertiary from '@/components/molecules/HeroTertiary'
import CardInsect from '@/components/molecules/CardInsect'
import CardListing from '@/components/molecules/CardListing'
import InsectGalleryModal from '@/components/molecules/InsectGalleryModal'
import PaginationNumbers from '@/components/molecules/PaginationNumbers'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { insectOverlayImages } from '@/lib/listing/mapInsectToCard'
import { mapStoryToCard } from '@/lib/listing/mapStoryToCard'
import {
  parseListingVariant,
  variantToComponent,
} from '@/lib/listing/resolveListingItems'
import type { ListingCardData } from '@/lib/listing/types'
import type {
  Card_listing_editorialStoryblok,
  ListingStoryblok,
} from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const EDITORIAL_INITIAL = 8
const EDITORIAL_STEP = 16
const HUB_PAGE_SIZE = 16
const HIGHLIGHT_INITIAL = 8
const HIGHLIGHT_STEP = 16

function RefCard({
  variant,
  dark,
  ...props
}: {
  variant: string
  dark?: boolean
  title: string
  description?: string
  image?: import('@/components/atoms/Asset').StoryblokAsset | null
  href?: string
}) {
  return (
    <CardListing
      title={props.title}
      description={props.description}
      image={props.image}
      href={props.href}
      showDownload={variant === 'catalogo'}
      dark={dark}
    />
  )
}

export default function Listing({ blok }: { blok?: ListingStoryblok }) {
  const t = useTranslations('')
  const refreshPageScroll = useRefreshPageScroll()
  const skipScrollRefresh = useRef(true)

  const listingType = blok?.type ?? 'editorial'
  const listingVariant = parseListingVariant(blok?.variant ?? blok?.listing_items)
  const imageRatio = listingVariant.image_ratio ?? 'portrait'
  const isDark = blok?.theme === 'dark'
  const isHub = listingType === 'hub'
  const isHighlight = listingType === 'highlight'
  const isInsect = listingVariant.variant === 'insetto'

  const editorialCards = (blok?.cards ?? []) as Card_listing_editorialStoryblok[]
  const contentComponent = variantToComponent(listingVariant.variant)
  const resolvedItems = blok?.resolved_items ?? []

  const refCards = useMemo(
    () => resolvedItems.map((story) => mapStoryToCard(story, contentComponent)),
    [resolvedItems, contentComponent],
  )

  const [visibleCount, setVisibleCount] = useState(
    isHub ? HUB_PAGE_SIZE : isHighlight ? HIGHLIGHT_INITIAL : EDITORIAL_INITIAL,
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [openInsect, setOpenInsect] = useState<ListingCardData | null>(null)

  useEffect(() => {
    setVisibleCount(
      isHub ? HUB_PAGE_SIZE : isHighlight ? HIGHLIGHT_INITIAL : EDITORIAL_INITIAL,
    )
    setCurrentPage(1)
  }, [isHub, isHighlight, listingType, editorialCards.length, refCards.length])

  const hubTotalPages = Math.max(1, Math.ceil(refCards.length / HUB_PAGE_SIZE))
  const hubPageItems = useMemo(() => {
    const start = (currentPage - 1) * HUB_PAGE_SIZE
    return refCards.slice(start, start + HUB_PAGE_SIZE)
  }, [refCards, currentPage])

  const editorialVisible = editorialCards.slice(0, visibleCount)
  const highlightVisible = refCards.slice(0, visibleCount)

  const hasMoreEditorial = visibleCount < editorialCards.length
  const hasMoreHighlight = visibleCount < refCards.length

  const loadMore = useCallback(() => {
    if (isHighlight) {
      setVisibleCount((n) => Math.min(n + HIGHLIGHT_STEP, refCards.length))
      return
    }
    setVisibleCount((n) => Math.min(n + EDITORIAL_STEP, editorialCards.length))
  }, [isHighlight, refCards.length, editorialCards.length])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [visibleCount, currentPage, refreshPageScroll])

  if (!blok) return null

  const showEmptyEditorial =
    listingType === 'editorial' && editorialCards.length === 0

  const gridCols = listingType === 'editorial' ? 'cols-3' : 'cols-4'

  const renderRefCard = (card: ListingCardData, index: number) => {
    if (isInsect) {
      return (
        <CardInsect
          key={`${card.uuid ?? card.title}-${index}`}
          {...card}
          onOpen={() => setOpenInsect(card)}
        />
      )
    }

    return (
      <RefCard
        key={`${card.href ?? card.title}-${index}`}
        variant={listingVariant.variant}
        {...card}
        dark={isDark}
      />
    )
  }

  return (
    <section
      className={cn('wrapper', { dark: isDark })}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as any)}
    >
      <Container className={cn('content')} flushBlock>
        <HeroTertiary
          title={blok.title}
          subtitle={!isDark ? blok.subtitle : undefined}
        />

        {showEmptyEditorial && (
          <p className={cn('empty-message')}>{t('no_events')}</p>
        )}

        {listingType === 'editorial' && editorialVisible.length > 0 && (
          <div className={cn('grid', gridCols)}>
            {editorialVisible.map((card) => (
              <CardListing
                key={card._uid}
                title={card.title}
                subtitle={card.subtitle}
                description={card.description}
                image={card.image}
                link={card.link}
                dark={isDark}
                imageRatio={imageRatio}
              />
            ))}
          </div>
        )}

        {isHub && hubPageItems.length > 0 && (
          <div className={cn('grid', gridCols)}>
            {hubPageItems.map((card, index) => renderRefCard(card, index))}
          </div>
        )}

        {isHub && hubPageItems.length === 0 && (
          <p className={cn('empty')}>Nessun elemento da mostrare.</p>
        )}

        {isHighlight && highlightVisible.length > 0 && (
          <div className={cn('grid', gridCols)}>
            {highlightVisible.map((card, index) => renderRefCard(card, index))}
          </div>
        )}

        {isHub && hubTotalPages > 1 && (
          <div className={cn('footer')}>
            <PaginationNumbers
              currentPage={currentPage}
              totalPages={hubTotalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {((listingType === 'editorial' && hasMoreEditorial) ||
          (isHighlight && hasMoreHighlight)) && (
          <div className={cn('footer')}>
            <Button
              icon="chevron-down"
              label={t('load_more')}
              variant={isDark ? 'tertiary' : 'secondary'}
              size="small"
              onClick={loadMore}
            />
          </div>
        )}
      </Container>

      {isInsect ? (
        <InsectGalleryModal
          open={Boolean(openInsect)}
          onClose={() => setOpenInsect(null)}
          title={openInsect?.title ?? ''}
          images={openInsect ? insectOverlayImages(openInsect) : []}
        />
      ) : null}
    </section>
  )
}

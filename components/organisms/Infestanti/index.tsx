'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import Container from '@/components/atoms/Container'
import HeroTertiary from '@/components/molecules/HeroTertiary'
import CardInsect from '@/components/molecules/CardInsect'
import FilterChips from '@/components/molecules/FilterChips'
import InsectGalleryModal from '@/components/molecules/InsectGalleryModal'
import PaginationNumbers from '@/components/molecules/PaginationNumbers'
import FullBanner from '@/components/organisms/FullBanner'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { getEmptyMotion, getGridMotion } from '@/lib/animation/gridPresence'
import { hasInsectGallery, insectOverlayImages } from '@/lib/listing/mapInsectToCard'
import { mapStoryToCard } from '@/lib/listing/mapStoryToCard'
import { INSECT_CATEGORIES, type InsectCategory } from '@/lib/insects/categories'
import { filterInsectsByCategory } from '@/lib/insects/filterInsects'
import {
  INSECT_PAGE_SIZE,
  MAX_BANNERS,
  interleaveInfestantiPage,
} from '@/lib/insects/interleaveBanners'
import { useInsectCategoryFilterUrl } from '@/lib/insects/useInsectCategoryFilterUrl'
import type { ListingCardData } from '@/lib/listing/types'
import type { Full_bannerStoryblok, InfestantiStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

function InfestantiInner({ blok }: { blok?: InfestantiStoryblok }) {
  const refreshPageScroll = useRefreshPageScroll()
  const skipScrollRefresh = useRef(true)
  const reduceMotion = useReducedMotion()
  const { categories, setCategories, currentPage, setCurrentPage } =
    useInsectCategoryFilterUrl()
  const [openInsect, setOpenInsect] = useState<ListingCardData | null>(null)

  const resolvedItems = blok?.resolved_items ?? []
  const banners = useMemo(
    () =>
      (blok?.banners ?? [])
        .filter((banner): banner is Full_bannerStoryblok => banner?.component === 'full_banner')
        .slice(0, MAX_BANNERS),
    [blok?.banners],
  )

  const filteredItems = useMemo(
    () => filterInsectsByCategory(resolvedItems, categories),
    [resolvedItems, categories],
  )

  const cards = useMemo(
    () => filteredItems.map((story) => mapStoryToCard(story, 'insect')),
    [filteredItems],
  )

  const totalPages = Math.max(1, Math.ceil(cards.length / INSECT_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const gridItems = useMemo(
    () => interleaveInfestantiPage(cards, banners, safePage),
    [cards, banners, safePage],
  )

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage)
    }
  }, [currentPage, safePage, setCurrentPage])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [safePage, categories, cards.length, refreshPageScroll])

  const handleCategoriesChange = useCallback(
    (next: InsectCategory[]) => {
      setCategories(next)
    },
    [setCategories],
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
        <HeroTertiary title={blok.title} subtitle={blok.subtitle} />

        <FilterChips
          items={INSECT_CATEGORIES}
          value={categories}
          onChange={handleCategoriesChange}
          ariaLabel="Infestanti"
          size="small"
        />

        {gridItems.length > 0 ? (
          <div className={cn('grid')}>
            <AnimatePresence
              mode="popLayout"
              initial={false}
              onExitComplete={handleGridExitComplete}
            >
              {gridItems.map((item, index) => {
                if (item.type === 'banner') {
                  return (
                    <motion.div
                      key={item.banner._uid}
                      className={cn('gridItem', 'banner')}
                      {...getGridMotion(index, reduceMotion)}
                    >
                      <FullBanner blok={item.banner} />
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={item.card.uuid ?? item.card.title}
                    className={cn('gridItem')}
                    {...getGridMotion(index, reduceMotion)}
                  >
                    <CardInsect
                      {...item.card}
                      onOpen={
                        hasInsectGallery(item.card)
                          ? () => setOpenInsect(item.card)
                          : undefined
                      }
                    />
                  </motion.div>
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
              Nessun infestante trovato con i filtri selezionati.
            </motion.p>
          </AnimatePresence>
        )}

        {totalPages > 1 ? (
          <div className={cn('footer')}>
            <PaginationNumbers
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </Container>

      <InsectGalleryModal
        open={Boolean(openInsect)}
        onClose={() => setOpenInsect(null)}
        title={openInsect?.title ?? ''}
        images={openInsect ? insectOverlayImages(openInsect) : []}
      />
    </section>
  )
}

export default function Infestanti({ blok }: { blok?: InfestantiStoryblok }) {
  return (
    <Suspense fallback={null}>
      <InfestantiInner blok={blok} />
    </Suspense>
  )
}

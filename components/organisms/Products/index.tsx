'use client'

import { Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import Container from '@/components/atoms/Container'
import CardListingProduct from '@/components/molecules/CardListingProduct'
import PaginationNumbers from '@/components/molecules/PaginationNumbers'
import ProductFilters, { type ProductFiltersValue } from '@/components/molecules/ProductFilters'
import ProductsStickyNav from '@/components/molecules/ProductsStickyNav'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll, SmoothScrollContext } from '@/lib/context/smooth-scroll-context'
import {
  getBundledFiltriEntries,
  getCategoryLabel,
  parseFiltriEntries,
} from '@/lib/filtri'
import { getApplicationAreaEntries } from '@/lib/products/applicationAreas'
import { filterProductStories, sortProductStories } from '@/lib/products/filterProducts'
import { useProductsFilterUrl } from '@/lib/products/useProductsFilterUrl'
import ProductCompareBar from '@/components/molecules/ProductCompareBar'
import ProductDownloadBar from '@/components/molecules/ProductDownloadBar'
import { mapStoryToCard } from '@/lib/listing/mapStoryToCard'
import {
  COMPARE_MAX,
  type ActiveProductBar,
  type ProductBarItem,
} from '@/lib/products/productBarTypes'
import { downloadAllSafetySheets } from '@/lib/products/downloadAllSafetySheets'
import { getLinkUrl } from '@/lib/api/utils/links'
import type { ProductsStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)
const PAGE_SIZE = 16
const GRID_EASE = [0.4, 0, 0.2, 1] as const
const GRID_STAGGER = 0.04

function ProductsInner({ blok }: { blok?: ProductsStoryblok }) {
  const refreshPageScroll = useRefreshPageScroll()
  const { lenis } = useContext(SmoothScrollContext)
  const skipScrollRefresh = useRef(true)
  const skipPageScrollRef = useRef(true)
  const filtersSentinelRef = useRef<HTMLDivElement>(null)
  const stickyFiltersRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { filters, setFilters, currentPage, setCurrentPage } = useProductsFilterUrl()
  const prevViewRef = useRef(filters.view)
  const deferListActions = prevViewRef.current === 'grid' && filters.view === 'list'

  const resolvedItems = blok?.resolved_items ?? []
  const comparisonPageUrl = useMemo(
    () => getLinkUrl(blok?.products_comparison_page ?? null),
    [blok?.products_comparison_page],
  )
  const [filtersStuck, setFiltersStuck] = useState(false)
  const [compareItems, setCompareItems] = useState<ProductBarItem[]>([])
  const [downloadItems, setDownloadItems] = useState<ProductBarItem[]>([])
  const [downloadMultiMode, setDownloadMultiMode] = useState(false)
  const [activeBar, setActiveBar] = useState<ActiveProductBar>(null)

  const parsedFiltri = useMemo(() => parseFiltriEntries(getBundledFiltriEntries()), [])

  const categoryOptions = useMemo(
    () =>
      parsedFiltri.categories.map((entry) => ({
        value: entry.value,
        label: getCategoryLabel(entry),
      })),
    [parsedFiltri.categories],
  )

  const applicationAreaOptions = useMemo(
    () =>
      getApplicationAreaEntries().map((entry) => ({
        value: entry.name,
        label: entry.value,
      })),
    [],
  )

  const filteredItems = useMemo(() => {
    const filtered = filterProductStories(resolvedItems, filters)
    return sortProductStories(filtered, filters.sort)
  }, [resolvedItems, filters])
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, currentPage])

  const handleGridExitComplete = useCallback(() => {
    refreshPageScroll()
  }, [refreshPageScroll])

  const scrollToGridTop = useCallback(() => {
    const grid = gridRef.current
    if (!grid || !lenis) return

    const stickyTopPx =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sticky-top')) ||
      0
    const filtersHeight = stickyFiltersRef.current?.offsetHeight ?? 0

    lenis.scrollTo(grid, {
      offset: -(stickyTopPx + filtersHeight),
      immediate: true,
    })
  }, [lenis])

  useEffect(() => {
    console.log('[Products] blok', blok)
    console.log('[Products] products_comparison_page', blok?.products_comparison_page)
    console.log('[Products] comparisonPageUrl', comparisonPageUrl)
  }, [blok, comparisonPageUrl])

  useEffect(() => {
    const sentinel = filtersSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setFiltersStuck(!entry.isIntersecting),
      { threshold: 1, rootMargin: '-1px 0px 0px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    prevViewRef.current = filters.view
  }, [filters.view])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [currentPage, filters, refreshPageScroll])

  useEffect(() => {
    if (skipPageScrollRef.current) {
      skipPageScrollRef.current = false
      return
    }
    scrollToGridTop()
  }, [currentPage, scrollToGridTop])

  const handleCategoryChange = useCallback((category: string | null) => {
    setFilters((prev) => ({
      ...prev,
      category,
      subcategories: [],
    }))
  }, [])

  const handleSubcategoriesChange = useCallback((chipValue: ProductFiltersValue) => {
    setFilters((prev) => ({
      ...prev,
      subcategories: chipValue.subcategories,
    }))
  }, [])

  const handleApplicationAreaChange = useCallback((applicationArea: string | null) => {
    setFilters((prev) => ({ ...prev, applicationArea }))
  }, [])

  const toBarItem = useCallback(
    (card: ReturnType<typeof mapStoryToCard>): ProductBarItem => ({
      uuid: card.uuid ?? '',
      title: card.title,
      image: card.image,
      href: card.href,
      safetySheetHref: card.safetySheetHref,
    }),
    [],
  )

  const handleCompareClick = useCallback((item: ProductBarItem) => {
    if (!item.uuid) return
    setCompareItems((prev) => {
      if (prev.some((entry) => entry.uuid === item.uuid)) return prev
      if (prev.length >= COMPARE_MAX) return prev
      return [...prev, item]
    })
    setActiveBar('compare')
  }, [])

  const handleCompareRemove = useCallback((uuid: string) => {
    setCompareItems((prev) => {
      const next = prev.filter((entry) => entry.uuid !== uuid)
      if (next.length === 0) {
        setActiveBar((current) => (current === 'compare' ? null : current))
      }
      return next
    })
  }, [])

  const handleDownloadClick = useCallback((item: ProductBarItem) => {
    if (!item.uuid) return

    if (downloadMultiMode && activeBar === 'download') {
      setDownloadItems((prev) => {
        if (prev.some((entry) => entry.uuid === item.uuid)) return prev
        return [...prev, item]
      })
      return
    }

    setDownloadItems([item])
    setDownloadMultiMode(false)
    setActiveBar('download')
  }, [activeBar, downloadMultiMode])

  const handleDownloadRemove = useCallback((uuid: string) => {
    setDownloadItems((prev) => {
      const next = prev.filter((entry) => entry.uuid !== uuid)
      if (next.length === 0) {
        setDownloadMultiMode(false)
        setActiveBar((current) => (current === 'download' ? null : current))
      }
      return next
    })
  }, [])

  const enableDownloadMultiSelect = useCallback(() => {
    setDownloadMultiMode(true)
  }, [])

  const handleDownloadAll = useCallback(() => {
    downloadAllSafetySheets(downloadItems)
  }, [downloadItems])

  const closeDownloadBar = useCallback(() => {
    setDownloadItems([])
    setDownloadMultiMode(false)
    setActiveBar((current) => (current === 'download' ? null : current))
  }, [])

  const closeCompareBar = useCallback(() => {
    setCompareItems([])
    setActiveBar((current) => (current === 'compare' ? null : current))
  }, [])

  const compareFull = compareItems.length >= COMPARE_MAX
  const barOffset =
    activeBar === 'compare'
      ? '6.5rem'
      : activeBar === 'download'
        ? downloadMultiMode
          ? '6.5rem'
          : '4.5rem'
        : '0px'

  if (!blok) return null

  const chipValue: ProductFiltersValue = {
    category: filters.category,
    subcategories: filters.subcategories,
  }

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok.anchor_id)}
      style={{ '--products-bar-offset': barOffset } as CSSProperties}
      {...storyblokEditable(blok as any)}
    >
      <div ref={filtersSentinelRef} className={cn('stickySentinel')} aria-hidden />
      <div ref={stickyFiltersRef} className={cn('stickyFilters', { stuck: filtersStuck })}>
        <Container className={cn('stickyFiltersInner')} flushBlock>
          <ProductsStickyNav
            filters={filters}
            categoryOptions={categoryOptions}
            applicationAreaOptions={applicationAreaOptions}
            onCategoryChange={handleCategoryChange}
            onApplicationAreaChange={handleApplicationAreaChange}
            onSortChange={(sort) => setFilters((prev) => ({ ...prev, sort }))}
            onViewChange={(view) => setFilters((prev) => ({ ...prev, view }))}
            barOffset={barOffset}
          />

          <ProductFilters
            className={cn('filters')}
            value={chipValue}
            onChange={handleSubcategoriesChange}
          />
        </Container>
      </div>

      <Container className={cn('content')} flushBlock>
        {(blok.title || blok.subtitle) && (
          <header className={cn('head')}>
            {blok.title ? <h2 className={cn('title')}>{blok.title}</h2> : null}
            {blok.subtitle ? <p className={cn('subtitle')}>{blok.subtitle}</p> : null}
          </header>
        )}

        {pageItems.length > 0 ? (
          <div
            ref={gridRef}
            className={cn('grid', filters.view === 'list' ? 'listView' : 'gridView')}
          >
            <AnimatePresence
              mode="popLayout"
              initial={false}
              onExitComplete={handleGridExitComplete}
            >
              {pageItems.map((story, index) => {
                const card = mapStoryToCard(story, 'product')
                const barItem = toBarItem(card)
                const isInCompare = compareItems.some((entry) => entry.uuid === card.uuid)
                const isInDownloadSelection = downloadItems.some(
                  (entry) => entry.uuid === card.uuid,
                )
                return (
                  <motion.div
                    key={story.uuid}
                    className={cn('gridItem')}
                    layout={!reduceMotion}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 12 }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        opacity: {
                          duration: reduceMotion ? 0.01 : 0.35,
                          ease: GRID_EASE,
                          delay: reduceMotion ? 0 : index * GRID_STAGGER,
                        },
                        y: {
                          duration: reduceMotion ? 0.01 : 0.35,
                          ease: GRID_EASE,
                          delay: reduceMotion ? 0 : index * GRID_STAGGER,
                        },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: reduceMotion ? 0 : -8,
                      transition: {
                        duration: reduceMotion ? 0.01 : 0.2,
                        ease: GRID_EASE,
                      },
                    }}
                    transition={{
                      layout: {
                        duration: reduceMotion ? 0.01 : 0.4,
                        ease: GRID_EASE,
                      },
                    }}
                  >
                    <CardListingProduct
                      {...card}
                      layout={filters.view}
                      deferListActions={deferListActions}
                      isInCompare={isInCompare}
                      compareDisabled={compareFull && !isInCompare}
                      isInDownloadSelection={isInDownloadSelection}
                      downloadMultiMode={downloadMultiMode && activeBar === 'download'}
                      onCompareClick={() => handleCompareClick(barItem)}
                      onCompareRemove={() => card.uuid && handleCompareRemove(card.uuid)}
                      onDownloadClick={() => handleDownloadClick(barItem)}
                      onDownloadRemove={() => card.uuid && handleDownloadRemove(card.uuid)}
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
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.3,
                ease: GRID_EASE,
              }}
            >
              Nessun prodotto trovato con i filtri selezionati.
            </motion.p>
          </AnimatePresence>
        )}

        {totalPages > 1 ? (
          <div className={cn('footer')}>
            <PaginationNumbers
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </Container>

      <ProductDownloadBar
        open={activeBar === 'download'}
        items={downloadItems}
        multiMode={downloadMultiMode}
        onClose={closeDownloadBar}
        onRemove={handleDownloadRemove}
        onEnableMultiSelect={enableDownloadMultiSelect}
        onDownloadAll={handleDownloadAll}
      />
      <ProductCompareBar
        open={activeBar === 'compare'}
        items={compareItems}
        comparisonPageUrl={comparisonPageUrl}
        onClose={closeCompareBar}
        onRemove={handleCompareRemove}
      />
    </section>
  )
}

export default function Products({ blok }: { blok?: ProductsStoryblok }) {
  return (
    <Suspense fallback={null}>
      <ProductsInner blok={blok} />
    </Suspense>
  )
}

'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Container from '@/components/atoms/Container'
import CardListing from '@/components/molecules/CardListing'
import FilterChips from '@/components/molecules/FilterChips'
import HeroTertiary from '@/components/molecules/HeroTertiary'
import CatalogDownloadModal from '@/components/organisms/CatalogsDownload/CatalogDownloadModal'
import { getEmptyMotion, getGridMotion, getTabPanelMotion } from '@/lib/animation/gridPresence'
import { hasHeroAsset, resolveDownloadableHeroImage } from '@/lib/downloadable/hero'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { groupByDivision, groupByYear, sliceGroupedItems } from '@/lib/downloadable/group'
import {
  filterDownloadablesByKind,
  mapDownloadableStoryToPreviewItem,
  sortStoriesByContentDate,
} from '@/lib/downloadable/map'
import { requiresDownloadForm } from '@/lib/downloadable/form'
import { downloadRemoteFile, toAbsoluteHttpsUrl } from '@/lib/downloadable/assets'
import {
  type DownloadPreviewItem,
  type ResourceTab,
} from '@/lib/downloadable/types'
import { useResourcesTabUrl } from '@/lib/downloadable/useResourcesTabUrl'
import type {
  DownloadableResourcesStoryblok,
  HeroStoryblok,
} from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const Hero = dynamic(() => import('@/components/organisms/Hero'))

const INITIAL_COUNT = 16
const LOAD_MORE_STEP = 16

const TAB_LABEL_KEY: Record<ResourceTab, string> = {
  cataloghi: 'resources_catalogs',
  brochure: 'resources_brochures',
  app: 'resources_apps',
  altro: 'resources_other',
  press: 'resources_press',
}

const TAB_ORDER: ResourceTab[] = ['cataloghi', 'brochure', 'app', 'press', 'altro']

/** Solo risorse effettivamente utilizzabili in lista (file o link app esterno). */
function isListableItem(item: DownloadPreviewItem): boolean {
  if (item.kind === 'app') {
    return Boolean(item.href && /^https?:\/\//i.test(item.href.trim()))
  }
  return Boolean(item.fileUrl)
}

function ResourceCard({
  item,
  onDownload,
}: {
  item: DownloadPreviewItem
  onDownload: (item: DownloadPreviewItem) => void
}) {
  const fileUrl = item.fileUrl ? toAbsoluteHttpsUrl(item.fileUrl) : undefined
  const gated = Boolean(fileUrl) && requiresDownloadForm(item)
  const isApp = item.kind === 'app'
  // App → link store. Con form → modal. Press/altro senza form → download PDF (non navigazione).
  const href = isApp ? item.href : undefined
  const onActivate = gated
    ? () => onDownload(item)
    : fileUrl
      ? () => {
          void downloadRemoteFile(fileUrl, item.modalFileName)
        }
      : undefined
  const showTitle = item.kind !== 'app' && item.kind !== 'altro'

  return (
    <CardListing
      title={showTitle ? item.label : undefined}
      description={item.shortDescription}
      image={item.cover}
      href={href}
      showDownload={Boolean(fileUrl)}
      placeholderWhenNoImage
      onActivate={onActivate}
    />
  )
}

function DownloadableResourcesInner({
  blok,
}: {
  blok: DownloadableResourcesStoryblok
}) {
  const t = useTranslations('')
  const refreshPageScroll = useRefreshPageScroll()
  const reduceMotion = useReducedMotion()
  const skipScrollRefresh = useRef(true)
  const downloadLabel = t('product_download')

  const resolvedDownloadables = blok.resolved_downloadables

  const catalogs = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'catalog'),
      )
        .map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel))
        .filter(isListableItem),
    [resolvedDownloadables, downloadLabel],
  )

  const brochures = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'brochure'),
      )
        .map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel))
        .filter(isListableItem),
    [resolvedDownloadables, downloadLabel],
  )

  const others = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'other'),
      )
        .map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel))
        .filter(isListableItem),
    [resolvedDownloadables, downloadLabel],
  )

  const apps = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'app'),
      )
        .map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel))
        .filter(isListableItem),
    [resolvedDownloadables, downloadLabel],
  )

  const press = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'press'),
      )
        .map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel))
        .filter(isListableItem),
    [resolvedDownloadables, downloadLabel],
  )

  const itemsByKind = useMemo(
    (): Record<ResourceTab, DownloadPreviewItem[]> => ({
      cataloghi: catalogs,
      brochure: brochures,
      app: apps,
      altro: others,
      press,
    }),
    [apps, brochures, catalogs, others, press],
  )

  const available = useMemo(
    () => TAB_ORDER.filter((tab) => itemsByKind[tab].length > 0),
    [itemsByKind],
  )

  const { kind, setKind } = useResourcesTabUrl(available)

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [downloadModal, setDownloadModal] = useState<{
    url: string
    name: string
    subtitle?: string
  } | null>(null)

  const filteredItems = useMemo(() => {
    if (!kind) return []
    return itemsByKind[kind]
  }, [itemsByKind, kind])

  const groups = useMemo(() => {
    if (kind === 'brochure') {
      return sliceGroupedItems(
        groupByDivision(filteredItems, (division) => t(division)),
        visibleCount,
      )
    }
    // App / press / altro: lista piatta, senza titoli di sezione (anno, ecc.).
    if (kind === 'app' || kind === 'press' || kind === 'altro') {
      return sliceGroupedItems([{ items: filteredItems }], visibleCount)
    }
    return sliceGroupedItems(groupByYear(filteredItems), visibleCount)
  }, [filteredItems, kind, t, visibleCount])
  const hasMore = visibleCount < filteredItems.length

  const handleKindsChange = useCallback(
    (next: ResourceTab[]) => {
      const selected = next[0]
      if (!selected) return
      setKind(selected)
      setVisibleCount(INITIAL_COUNT)
    },
    [setKind],
  )

  const loadMore = useCallback(() => {
    setVisibleCount((n) => n + LOAD_MORE_STEP)
  }, [])

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [kind])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [visibleCount, kind, refreshPageScroll])

  const openDownload = useCallback((item: DownloadPreviewItem) => {
    setDownloadModal({
      url: item.fileUrl ? toAbsoluteHttpsUrl(item.fileUrl) : '',
      name: item.modalFileName,
      subtitle: item.shortDescription ?? '',
    })
  }, [])

  const closeDownloadModal = useCallback(() => {
    setDownloadModal(null)
  }, [])

  const handleGridExitComplete = useCallback(() => {
    refreshPageScroll()
  }, [refreshPageScroll])

  const title = typeof blok.title === 'string' ? blok.title.trim() : ''
  const hasTitle = title.length > 0
  const heroImage = useMemo(
    () => resolveDownloadableHeroImage(blok, kind),
    [blok, kind],
  )
  const hasImage = hasHeroAsset(heroImage)
  const showPrimaryHero = hasTitle && hasImage
  const showTertiaryHero = hasTitle && !hasImage
  // Chip solo per categorie con item; la barra serve se c'è almeno una scelta.
  const showChips = available.length > 1

  const primaryHeroBlok = useMemo((): HeroStoryblok | null => {
    if (!showPrimaryHero) return null
    return {
      _uid: `${blok._uid}-hero`,
      component: 'hero',
      variant: 'primary',
      title,
      background: heroImage,
    }
  }, [blok._uid, heroImage, showPrimaryHero, title])

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as never)}
    >
      <CatalogDownloadModal
        open={downloadModal !== null}
        fileUrl={downloadModal?.url ?? ''}
        fileName={downloadModal?.name ?? ''}
        subtitle={downloadModal?.subtitle}
        onClose={closeDownloadModal}
      />
      {primaryHeroBlok ? <Hero blok={primaryHeroBlok} /> : null}
      <div
        className={cn('body', {
          afterPrimary: showPrimaryHero,
          noHero: !hasTitle,
        })}
      >
      <Container className={cn('content')} flushBlock>
        {showTertiaryHero ? (
          <div className={cn('head')}>
            <HeroTertiary title={title} as="h1" />
          </div>
        ) : null}

        {showChips ? (
          <FilterChips
            items={available}
            value={kind ? [kind] : []}
            onChange={handleKindsChange}
            showAll={false}
            size="m"
            exclusive
            ariaLabel={t('resources_tablist')}
            getLabel={(item) => t(TAB_LABEL_KEY[item])}
          />
        ) : null}

        <AnimatePresence mode="wait" initial={false} onExitComplete={handleGridExitComplete}>
          {groups.some((group) => group.items.length > 0) ? (
            <motion.div
              key={kind ?? 'empty-kind'}
              className={cn('groups')}
              {...getTabPanelMotion(reduceMotion)}
            >
              {groups.map((group) => {
                const groupKey = group.heading ?? 'ungrouped'
                return (
                  <section key={groupKey} className={cn('group')}>
                    {group.heading ? (
                      <h2 className={cn('groupHeading')}>{group.heading}</h2>
                    ) : null}
                    <div className={cn('grid')}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {group.items.map((item, index) => (
                          <motion.div
                            key={item.key}
                            className={cn('gridItem')}
                            {...getGridMotion(index, reduceMotion)}
                          >
                            <ResourceCard
                              item={item}
                              onDownload={openDownload}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                )
              })}
            </motion.div>
          ) : (
            <motion.p
              key={`empty-${kind ?? 'none'}`}
              className={cn('empty')}
              {...getEmptyMotion(reduceMotion)}
            >
              {t('no_events')}
            </motion.p>
          )}
        </AnimatePresence>

        {hasMore ? (
          <div className={cn('footer')}>
            <Button
              icon="chevron-down"
              label={t('load_more')}
              onClick={loadMore}
              variant="secondary"
            />
          </div>
        ) : null}
      </Container>
      </div>
    </section>
  )
}

export default function DownloadableResources({
  blok,
}: {
  blok?: DownloadableResourcesStoryblok
}) {
  if (!blok) return null

  return (
    <Suspense fallback={null}>
      <DownloadableResourcesInner blok={blok} />
    </Suspense>
  )
}

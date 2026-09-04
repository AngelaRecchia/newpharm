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
import { getEmptyMotion, getGridMotion } from '@/lib/animation/gridPresence'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { groupByYear, sliceGroupedItems } from '@/lib/downloadable/group'
import {
  filterDownloadablesByKind,
  mapCatalogStoryToPreviewItem,
  mapDownloadableStoryToPreviewItem,
  mergeListingStoriesByUuid,
  sortStoriesByContentDate,
} from '@/lib/downloadable/map'
import { requiresDownloadForm } from '@/lib/downloadable/form'
import { toAbsoluteHttpsUrl } from '@/lib/downloadable/assets'
import { parseDownloadableKind } from '@/lib/downloadable/parse'
import {
  type DownloadPreviewItem,
  type ResourceTab,
} from '@/lib/downloadable/types'
import { useResourcesTabUrl } from '@/lib/downloadable/useResourcesTabUrl'
import type {
  AssetStoryblok,
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
}

function hasHeroAsset(image?: AssetStoryblok[] | null): boolean {
  const first = image?.[0]
  return Boolean(first?.desktop?.filename || first?.mobile?.filename)
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
  const href = gated ? undefined : fileUrl ?? item.href

  return (
    <CardListing
      title={item.label}
      description={item.shortDescription}
      image={item.cover}
      href={href}
      showDownload={Boolean(fileUrl)}
      titleOnlyWhenNoImage
      onActivate={gated ? () => onDownload(item) : undefined}
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

  const catalogs = useMemo(() => {
    const catalogStories = sortStoriesByContentDate(
      mergeListingStoriesByUuid(
        blok.resolved_catalogs ?? [],
        filterDownloadablesByKind(blok.resolved_downloadables ?? [], 'catalog'),
      ),
    )

    return catalogStories
      .map((story) =>
        parseDownloadableKind(story.content.kind) === 'catalog'
          ? mapDownloadableStoryToPreviewItem(story, downloadLabel)
          : mapCatalogStoryToPreviewItem(story, downloadLabel),
      )
      .filter((item) => Boolean(item.fileUrl))
  }, [blok.resolved_catalogs, blok.resolved_downloadables, downloadLabel])

  const resolvedDownloadables = blok.resolved_downloadables

  const brochures = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'brochure'),
      ).map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel)),
    [resolvedDownloadables, downloadLabel],
  )

  const others = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'other'),
      ).map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel)),
    [resolvedDownloadables, downloadLabel],
  )

  const apps = useMemo(
    () =>
      sortStoriesByContentDate(
        filterDownloadablesByKind(resolvedDownloadables ?? [], 'app'),
      ).map((story) => mapDownloadableStoryToPreviewItem(story, downloadLabel)),
    [resolvedDownloadables, downloadLabel],
  )

  const available = useMemo(() => {
    const tabs: ResourceTab[] = []
    if (catalogs.length > 0) tabs.push('cataloghi')
    if (brochures.length > 0) tabs.push('brochure')
    if (apps.length > 0) tabs.push('app')
    if (others.length > 0) tabs.push('altro')
    return tabs
  }, [apps.length, brochures.length, catalogs.length, others.length])

  const { kind, setKind } = useResourcesTabUrl(available)

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [downloadModal, setDownloadModal] = useState<{
    url: string
    name: string
    subtitle?: string
  } | null>(null)

  const itemsByKind = useMemo(
    (): Record<ResourceTab, DownloadPreviewItem[]> => ({
      cataloghi: catalogs,
      brochure: brochures,
      app: apps,
      altro: others,
    }),
    [apps, brochures, catalogs, others],
  )

  const filteredItems = useMemo(() => {
    if (!kind) return []
    return itemsByKind[kind]
  }, [itemsByKind, kind])

  const yearGroups = useMemo(
    () => groupByYear(filteredItems),
    [filteredItems],
  )
  const groups = useMemo(
    () => sliceGroupedItems(yearGroups, visibleCount),
    [yearGroups, visibleCount],
  )
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
  const hasImage = hasHeroAsset(blok.image)
  const showPrimaryHero = hasTitle && hasImage
  const showTertiaryHero = hasTitle && !hasImage
  const showChips = available.length > 0

  const primaryHeroBlok = useMemo((): HeroStoryblok | null => {
    if (!showPrimaryHero) return null
    return {
      _uid: `${blok._uid}-hero`,
      component: 'hero',
      variant: 'primary',
      title,
      background: blok.image,
    }
  }, [blok._uid, blok.image, showPrimaryHero, title])

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
      <div className={cn('body')}>
      <Container
        className={cn('content', {
          afterPrimary: showPrimaryHero,
          noHero: !hasTitle,
        })}
        flushBlock
      >
        {showTertiaryHero ? (
          <div className={cn('head')}>
            <HeroTertiary title={title} as="h1" />
          </div>
        ) : null}

        {showChips ? (
          <FilterChips
            className={cn('chips')}
            items={available}
            value={kind ? [kind] : []}
            onChange={handleKindsChange}
            size="large"
            showAll={false}
            exclusive
            hoverBlack
            ariaLabel={t('resources_tablist')}
            getLabel={(item) => t(TAB_LABEL_KEY[item])}
          />
        ) : null}

        {groups.some((group) => group.items.length > 0) ? (
          <div className={cn('groups')}>
            {groups.map((group) => {
              const groupKey = group.heading ?? 'ungrouped'
              return (
                <section key={groupKey} className={cn('group')}>
                  {group.heading ? (
                    <h2 className={cn('groupHeading')}>{group.heading}</h2>
                  ) : null}
                  <div className={cn('grid')}>
                    <AnimatePresence
                      mode="popLayout"
                      initial={false}
                      onExitComplete={handleGridExitComplete}
                    >
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
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key="empty"
              className={cn('empty')}
              {...getEmptyMotion(reduceMotion)}
            >
              {t('no_events')}
            </motion.p>
          </AnimatePresence>
        )}

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

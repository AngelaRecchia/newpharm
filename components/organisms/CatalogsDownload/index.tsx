'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Asset from '@/components/atoms/Asset'
import {
  CatalogStoryblok,
  CatalogStoryResolved,
  CatalogsDownloadStoryblok,
} from '@/types/storyblok'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import CatalogDownloadModal from './CatalogDownloadModal'
import {
  firstCoverAsset,
  getCatalogBlok,
  getCatalogRowMeta,
} from './catalogHelpers'
import styles from './index.module.scss'
import Button from '@/components/atoms/Button'

const cn = classNames.bind(styles)

const PAGE_INITIAL = 5
const PAGE_STEP = 5

export default function CatalogsDownload({
  blok,
}: {
  blok?: CatalogsDownloadStoryblok
}) {
  const t = useTranslations('')
  const refreshPageScroll = useRefreshPageScroll()
  const skipScrollRefresh = useRef(true)
  const { title, items } = blok ?? {}
  const productDownloadLabel = t('product_download')

  const catalogs = useMemo(() => {
    if (!items?.length) return []
    const out: CatalogStoryblok[] = []
    for (const raw of items) {
      const c = getCatalogBlok(raw as CatalogStoryblok | CatalogStoryResolved | string)
      if (c) out.push(c)
    }
    return out
  }, [items])

  const [previewIndex, setPreviewIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(PAGE_INITIAL)
  const [downloadModal, setDownloadModal] = useState<{
    url: string
    name: string
    subtitle?: string
  } | null>(null)

  const previewCatalog = useMemo(() => {
    const safe = Math.min(
      previewIndex,
      Math.max(0, catalogs.length - 1)
    )
    return catalogs[safe] ?? catalogs[0]
  }, [catalogs, previewIndex])

  const coverAsset = useMemo(
    () => (previewCatalog ? firstCoverAsset(previewCatalog) : null),
    [previewCatalog]
  )

  const visibleCatalogs = useMemo(
    () => catalogs.slice(0, visibleCount),
    [catalogs, visibleCount]
  )

  const hasMore = visibleCount < catalogs.length

  const showPreview = useCallback(
    (index: number) => {
      if (index >= 0 && index < catalogs.length) setPreviewIndex(index)
    },
    [catalogs.length]
  )

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + PAGE_STEP, catalogs.length))
  }, [catalogs.length])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [visibleCount, refreshPageScroll])

  const openDownloadForCatalog = useCallback(
    (catalog: CatalogStoryblok) => {
      const { fileUrl, modalFileName, shortDescription } = getCatalogRowMeta(
        catalog,
        productDownloadLabel
      )
      setDownloadModal({
        url: fileUrl ?? '',
        name: modalFileName,
        subtitle: shortDescription ?? '',
      })
    },
    [productDownloadLabel]
  )

  const closeDownloadModal = useCallback(() => {
    setDownloadModal(null)
  }, [])

  if (!blok) return null

  if (catalogs.length === 0) {
    return (
      <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
        <div className={cn('container')}>
          {title && <h2 className={cn('title')}>{title}</h2>}
        </div>
      </section>
    )
  }

  const renderPreview = (variant: 'sticky' | 'mobile') => {
    if (!coverAsset) return <></>
    const previewMotionKey = `${previewCatalog?._uid ?? 'catalog'}-${previewIndex}-${variant}`
    return (
      <div className={cn('preview', variant)} aria-hidden={true}>
        <div className={cn('previewInner')}>
          <div className={cn('previewFrame')}>
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={previewMotionKey}
                className={cn('previewMotion')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <Asset
                  asset={coverAsset}
                  size="l"
                  mode="fit"
                  className={cn('previewAsset')}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
      <CatalogDownloadModal
        open={downloadModal !== null}
        fileUrl={downloadModal?.url ?? ''}
        fileName={downloadModal?.name ?? ''}
        subtitle={downloadModal?.subtitle}
        onClose={closeDownloadModal}
      />
      <div className={cn('container')}>
        <div className={cn('layout')}>
          {renderPreview('sticky')}

          <div className={cn('main')}>
            {title && <h2 className={cn('title')}>{title}</h2>}

            {renderPreview('mobile')}

            <ul className={cn('list')}>
              {visibleCatalogs.map((catalog, rowIndex) => {
                const { label } = getCatalogRowMeta(catalog, productDownloadLabel)

                return (
                  <li
                    key={`${catalog._uid}-${rowIndex}`}
                    role="button"
                    tabIndex={0}
                    className={cn('row')}
                    onMouseEnter={() => showPreview(rowIndex)}
                    onFocus={() => showPreview(rowIndex)}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openDownloadForCatalog(catalog)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openDownloadForCatalog(catalog)
                      }
                    }}
                    aria-label={`${label} — ${productDownloadLabel}`}
                    aria-haspopup="dialog"
                  >
                    <span className={cn('rowLabel')}>{label}</span>
                    <Button
                      icon='download'
                      inert
                      variant='secondary'
                      size='small'
                    />
                  </li>
                )
              })}
            </ul>

            {hasMore && (
              <div className={cn('footer')}>
                <Button
                  icon='chevron-down'
                  label={t('load_more')}
                  variant='secondary'
                  size='small'
                  onClick={loadMore}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

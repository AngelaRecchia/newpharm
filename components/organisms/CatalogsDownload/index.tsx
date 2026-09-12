'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import DownloadPreviewList from '@/components/molecules/DownloadPreviewList'
import {
  CatalogsDownloadStoryblok,
} from '@/types/storyblok'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'
import { PAGE_INITIAL, PAGE_STEP } from '@/lib/downloadable/types'
import type { DownloadPreviewItem } from '@/lib/downloadable/types'
import CatalogDownloadModal from './CatalogDownloadModal'
import {
  firstCoverAsset,
  getCatalogBlok,
  getCatalogItemKey,
  getCatalogRowMeta,
} from './catalogHelpers'
import styles from './index.module.scss'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'

const cn = classNames.bind(styles)

export default function CatalogsDownload({
  blok,
}: {
  blok?: CatalogsDownloadStoryblok
}) {
  const t = useTranslations('')
  const refreshPageScroll = useRefreshPageScroll()
  const skipScrollRefresh = useRef(true)
  const { title, items, anchor_id } = blok ?? {}
  const productDownloadLabel = t('product_download')

  const previewItems = useMemo(() => {
    if (!items?.length) return []
    const out: DownloadPreviewItem[] = []
    for (const raw of items) {
      const catalog = getCatalogBlok(raw)
      if (!catalog) continue
      const meta = getCatalogRowMeta(catalog, productDownloadLabel)
      if (!meta.fileUrl) continue
      out.push({
        key: getCatalogItemKey(raw, catalog),
        kind: 'cataloghi',
        label: meta.label,
        cover: firstCoverAsset(catalog),
        fileUrl: meta.fileUrl,
        modalFileName: meta.modalFileName,
        shortDescription: meta.shortDescription,
      })
    }
    return out
  }, [items, productDownloadLabel])

  const groups = useMemo(() => [{ items: previewItems }], [previewItems])

  const [previewIndex, setPreviewIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(PAGE_INITIAL)
  const [downloadModal, setDownloadModal] = useState<{
    url: string
    name: string
    subtitle?: string
  } | null>(null)

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + PAGE_STEP, previewItems.length))
  }, [previewItems.length])

  useEffect(() => {
    if (skipScrollRefresh.current) {
      skipScrollRefresh.current = false
      return
    }
    refreshPageScroll()
  }, [visibleCount, refreshPageScroll])

  const openDownload = useCallback((item: DownloadPreviewItem) => {
    setDownloadModal({
      url: item.fileUrl ?? '',
      name: item.modalFileName,
      subtitle: item.shortDescription ?? '',
    })
  }, [])

  const closeDownloadModal = useCallback(() => {
    setDownloadModal(null)
  }, [])

  if (!blok) return null

  return (
    <section className={cn('wrapper')} id={getStoryblokAnchorId(anchor_id)} {...storyblokEditable(blok as never)}>
      <CatalogDownloadModal
        open={downloadModal !== null}
        fileUrl={downloadModal?.url ?? ''}
        fileName={downloadModal?.name ?? ''}
        subtitle={downloadModal?.subtitle}
        onClose={closeDownloadModal}
      />
      <div className={cn('container')}>
        {previewItems.length > 0 ? (
          <DownloadPreviewList
            groups={groups}
            visibleCount={visibleCount}
            previewIndex={previewIndex}
            downloadLabel={productDownloadLabel}
            loadMoreLabel={t('load_more')}
            header={title ? <h2 className={cn('title')}>{title}</h2> : null}
            onPreview={setPreviewIndex}
            onDownload={openDownload}
            onLoadMore={loadMore}
          />
        ) : (
          title ? <h2 className={cn('title')}>{title}</h2> : null
        )}
      </div>
    </section>
  )
}

'use client'

import { useCallback, useMemo, type ReactNode } from 'react'
import classNames from 'classnames/bind'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import Icon from '@/components/atoms/Icon'
import { countGroupedItems, sliceGroupedItems } from '@/lib/downloadable/group'
import type { DownloadPreviewGroup, DownloadPreviewItem } from '@/lib/downloadable/types'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type DownloadPreviewListProps = {
  groups: DownloadPreviewGroup[]
  visibleCount: number
  previewIndex: number
  downloadLabel: string
  loadMoreLabel: string
  header?: ReactNode
  onPreview: (index: number) => void
  onDownload: (item: DownloadPreviewItem) => void
  onLoadMore: () => void
}

export default function DownloadPreviewList({
  groups,
  visibleCount,
  previewIndex,
  downloadLabel,
  loadMoreLabel,
  header,
  onPreview,
  onDownload,
  onLoadMore,
}: DownloadPreviewListProps) {
  const totalCount = countGroupedItems(groups)
  const visibleGroups = useMemo(
    () => sliceGroupedItems(groups, visibleCount),
    [groups, visibleCount],
  )
  const visibleItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  )
  const indexedGroups = useMemo(() => {
    let offset = 0
    return visibleGroups.map((group) => {
      const startOffset = offset
      offset += group.items.length
      return { ...group, startOffset }
    })
  }, [visibleGroups])
  const hasMore = visibleCount < totalCount

  const activeIndex = Math.min(previewIndex, Math.max(0, visibleItems.length - 1))

  const showPreview = useCallback(
    (index: number) => {
      if (index === previewIndex) return
      if (index >= 0 && index < visibleItems.length) onPreview(index)
    },
    [onPreview, previewIndex, visibleItems.length],
  )

  const renderPreview = (variant: 'sticky' | 'mobile') => {
    const hasCover = visibleItems.some((item) => item.cover)
    if (!hasCover) return null

    return (
      <div className={cn('preview', variant)} aria-hidden={true}>
        <div className={cn('previewInner')}>
          <div className={cn('previewFrame')}>
            {visibleItems.map((item, index) => {
              if (!item.cover) return null
              const isActive = index === activeIndex
              return (
                <div
                  key={item.key}
                  className={cn('previewLayer', { active: isActive })}
                  aria-hidden={!isActive}
                >
                  <Asset
                    asset={item.cover}
                    size="l"
                    mode="fit"
                    className={cn('previewAsset')}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('layout')}>
      {renderPreview('sticky')}

      <div className={cn('main')}>
        {header}
        {renderPreview('mobile')}

        <ul className={cn('list')}>
          {indexedGroups.map((group, groupIndex) => {
            const headingId = group.heading
              ? `download-group-${group.heading}-${groupIndex}`
              : undefined

            return (
              <li key={headingId ?? `group-${groupIndex}`} className={cn('group')}>
                {group.heading ? (
                  <h3 className={cn('groupHeading')} id={headingId}>
                    {group.heading}
                  </h3>
                ) : null}
                <ul className={cn('rows')} aria-labelledby={headingId || undefined}>
                  {group.items.map((item, itemIndex) => {
                    const index = group.startOffset + itemIndex
                    return (
                      <li
                        key={item.key}
                        role="button"
                        tabIndex={0}
                        className={cn('row')}
                        onMouseEnter={() => showPreview(index)}
                        onFocus={() => showPreview(index)}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onDownload(item)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onDownload(item)
                          }
                        }}
                        aria-label={`${item.label} — ${downloadLabel}`}
                        aria-haspopup="dialog"
                      >
                        <span className={cn('rowText')}>
                          <span className={cn('rowLabel')}>{item.label}</span>
                          {item.meta ? (
                            <span className={cn('rowMeta')}>{item.meta}</span>
                          ) : null}
                        </span>
                        <span className={cn('rowDownload')} aria-hidden>
                          <Icon type="download" size="s" />
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>

        {hasMore ? (
          <div className={cn('footer')}>
            <Button
              icon="chevron-down"
              label={loadMoreLabel}
              variant="secondary"
              size="small"
              onClick={onLoadMore}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

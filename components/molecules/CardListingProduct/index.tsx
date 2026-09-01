'use client'

import classNames from 'classnames/bind'
import { useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import styles from './index.module.scss'
import Asset, { type StoryblokAsset } from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import SmartLink from '@/components/atoms/SmartLink'

const cn = classNames.bind(styles)

export type CardListingRefProps = {
  uuid?: string
  title: string
  description?: string
  image?: StoryblokAsset | null
  href?: string
  safetySheetHref?: string
  layout?: 'grid' | 'list'
  deferListActions?: boolean
  isInCompare?: boolean
  compareDisabled?: boolean
  isInDownloadSelection?: boolean
  downloadMultiMode?: boolean
  onCompareClick?: () => void
  onCompareRemove?: () => void
  onDownloadClick?: () => void
  onDownloadRemove?: () => void
}

function ListActions({
  deferListActions,
  isInCompare,
  compareDisabled,
  isInDownloadSelection,
  downloadMultiMode,
  onCompareClick,
  onCompareRemove,
  onDownloadClick,
  onDownloadRemove,
  compareLabel,
  removeLabel,
  downloadLabel,
  addLabel,
}: {
  deferListActions?: boolean
  isInCompare?: boolean
  compareDisabled?: boolean
  isInDownloadSelection?: boolean
  downloadMultiMode?: boolean
  onCompareClick?: () => void
  onCompareRemove?: () => void
  onDownloadClick?: () => void
  onDownloadRemove?: () => void
  compareLabel: string
  removeLabel: string
  downloadLabel: string
  addLabel: string
}) {
  const reduceMotion = useReducedMotion()
  const downloadAction =
    downloadMultiMode && isInDownloadSelection ? (
      <Button
        variant="tertiary"
        size="small"
        label={removeLabel}
        icon="more"
        iconPlain
        iconRotate
        className={cn('downloadRemove')}
        onClick={onDownloadRemove}
      />
    ) : downloadMultiMode ? (
      <Button
        variant="tertiary"
        size="small"
        label={addLabel}
        icon="more"
        iconPlain
        className={cn('downloadAdd')}
        onClick={onDownloadClick}
      />
    ) : (
      <Button
        variant="primary"
        size="small"
        label={downloadLabel}
        icon="download"
        onClick={onDownloadClick}
      />
    )

  return (
    <div
      className={cn('listActions', {
        listActionsDeferred: deferListActions && !reduceMotion,
      })}
    >
      {isInCompare ? (
        <Button
          variant="secondary"
          size="small"
          label={removeLabel}
          icon="minus"
          onClick={onCompareRemove}
        />
      ) : (
        <Button
          variant="secondary"
          size="small"
          label={compareLabel}
          icon="more"
          onClick={onCompareClick}
          disabled={compareDisabled}
        />
      )}
      {downloadAction}
    </div>
  )
}

export default function CardListingProduct(props: CardListingRefProps) {
  return <CardListingRef {...props} />
}

export function CardListingRef({
  title,
  description,
  image,
  href,
  layout = 'grid',
  deferListActions,
  isInCompare,
  compareDisabled,
  isInDownloadSelection,
  downloadMultiMode,
  onCompareClick,
  onCompareRemove,
  onDownloadClick,
  onDownloadRemove,
}: CardListingRefProps) {
  const t = useTranslations('')
  const compareLabel = t('compare')
  const removeLabel = t('remove')
  const downloadLabel = t('product_download')
  const addLabel = t('add')
  const productHref = href ? `/${href}` : undefined

  if (layout === 'list') {
    return (
      <article className={cn('wrapper', 'listLayout')}>
        <div className={cn('listImage')}>
          {image && <Asset asset={image} size="m" mode="fit" />}
        </div>
        <div className={cn('listBody')}>
          {productHref ? (
            <SmartLink href={productHref} className={cn('listTitle')}>
              {title}
            </SmartLink>
          ) : (
            <h3 className={cn('listTitle')}>{title}</h3>
          )}
          {description ? (
            <p className={cn('listDescription')}>{description}</p>
          ) : null}
          <ListActions
            deferListActions={deferListActions}
            isInCompare={isInCompare}
            compareDisabled={compareDisabled}
            isInDownloadSelection={isInDownloadSelection}
            downloadMultiMode={downloadMultiMode}
            onCompareClick={onCompareClick}
            onCompareRemove={onCompareRemove}
            onDownloadClick={onDownloadClick}
            onDownloadRemove={onDownloadRemove}
            compareLabel={compareLabel}
            removeLabel={removeLabel}
            downloadLabel={downloadLabel}
            addLabel={addLabel}
          />
        </div>
      </article>
    )
  }

  const gridInner = (
    <>
      <div className={cn('image')}>
        {image && <Asset asset={image} size="m" mode="fit" />}
      </div>
      <div className={cn('footer')}>
        <div className={cn('dot')} aria-hidden />
        <div className={cn('content')}>
          <h3 className={cn('title')}>{title}</h3>
          {description && <p className={cn('description')}>{description}</p>}
        </div>
      </div>
    </>
  )

  if (productHref) {
    return (
      <SmartLink href={productHref} className={cn('wrapper')}>
        {gridInner}
      </SmartLink>
    )
  }

  return <article className={cn('wrapper')}>{gridInner}</article>
}

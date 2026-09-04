'use client'

import classNames from 'classnames/bind'
import Asset from '@/components/atoms/Asset'
import type { ListingCardData } from '@/lib/listing/types'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type CardInsectProps = ListingCardData & {
  onOpen?: () => void
}

export default function CardInsect({
  title,
  description,
  image,
  imageHover,
  onOpen,
}: CardInsectProps) {
  const hasHover = Boolean(imageHover)
  const isInteractive = Boolean(onOpen)
  const className = cn('wrapper', { hoverable: hasHover, interactive: isInteractive })

  const inner = (
    <>
      <span className={cn('image')}>
        {image ? (
          <span className={cn('layer', 'primary')}>
            <Asset asset={image} size="m" />
          </span>
        ) : null}
        {imageHover ? (
          <span className={cn('layer', 'hover')}>
            <Asset asset={imageHover} size="m" />
          </span>
        ) : null}
      </span>
      <span className={cn('content-wrapper')}>
        <span className={cn('content')}>
          {title ? <span className={cn('title')}>{title}</span> : null}
          {description ? <span className={cn('description')}>{description}</span> : null}
        </span>
      </span>
    </>
  )

  if (isInteractive) {
    return (
      <button type="button" className={className} onClick={onOpen}>
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}

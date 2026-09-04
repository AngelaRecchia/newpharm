'use client'

import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import Asset, { type StoryblokAsset } from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type CardAppProps = {
  title: string
  description?: string
  image: StoryblokAsset | null
  iosUrl?: string
  androidUrl?: string
}

export default function CardApp({
  title,
  description,
  image,
  iosUrl,
  androidUrl,
}: CardAppProps) {
  const t = useTranslations('')

  return (
    <article className={cn('wrapper')}>
      <div className={cn('image')}>
        {image ? <Asset asset={image} size="m" /> : null}
      </div>
      <div className={cn('content')}>
        <h3 className={cn('title')}>{title}</h3>
        {description ? <p className={cn('description')}>{description}</p> : null}
        {iosUrl || androidUrl ? (
          <div className={cn('actions')}>
            {androidUrl ? (
              <Button
                href={androidUrl}
                target="_blank"
                label={t('google_play')}
                icon="external"
                variant="secondary"
                size="small"
              />
            ) : null}
            {iosUrl ? (
              <Button
                href={iosUrl}
                target="_blank"
                label={t('app_store')}
                icon="external"
                variant="secondary"
                size="small"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

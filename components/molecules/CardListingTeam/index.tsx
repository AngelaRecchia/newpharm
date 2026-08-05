import classNames from 'classnames/bind'
import styles from './index.module.scss'
import Asset from '@/components/atoms/Asset'
import { AssetStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles)

export default function CardListingTeam({
  title,
  subtitle,
  description,
  image,
  dark = true,
}: {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  image?: AssetStoryblok[] | AssetStoryblok | null
  dark?: boolean
}) {
  const asset = Array.isArray(image) ? image[0] : image

  return (
    <article className={cn('wrapper', { dark })}>
      <div className={cn('image')}>
        {asset && <Asset asset={asset} size="l" />}
      </div>
      <div className={cn('content-wrapper')}>
        <div className={cn('content')}>
          {title && <h3 className={cn('title')}>{title}</h3>}
          {subtitle && <p className={cn('subtitle')}>{subtitle}</p>}
          {description && <p className={cn('description')}>{description}</p>}
        </div>
      </div>
    </article>
  )
}

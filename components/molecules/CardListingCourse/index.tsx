import classNames from 'classnames/bind'
import styles from '../CardListingTeam/index.module.scss'
import Asset from '@/components/atoms/Asset'
import SmartLink from '@/components/atoms/SmartLink'
import { AssetStoryblok, LinkStoryblok } from '@/types/storyblok'
import { getFirstValidLink } from '@/lib/api/utils/links'

const cn = classNames.bind(styles)

export default function CardListingCourse({
  title,
  subtitle,
  description,
  image,
  link,
}: {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  image?: AssetStoryblok[] | AssetStoryblok | null
  link?: LinkStoryblok[] | LinkStoryblok | null
}) {
  const asset = Array.isArray(image) ? image[0] : image
  const validLink = link ? getFirstValidLink(Array.isArray(link) ? link : [link]) : null

  const inner = (
    <>
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
    </>
  )

  if (validLink?.link) {
    return (
      <SmartLink link={validLink.link} className={cn('wrapper', { dark: true })}>
        {inner}
      </SmartLink>
    )
  }

  return <article className={cn('wrapper', { dark: true })}>{inner}</article>
}

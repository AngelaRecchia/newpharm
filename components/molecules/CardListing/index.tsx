import classNames from 'classnames/bind'
import Asset, { type StoryblokAsset } from '@/components/atoms/Asset'
import Icon from '@/components/atoms/Icon'
import SmartLink from '@/components/atoms/SmartLink'
import { AssetStoryblok } from '@/types/storyblok'
import { getLinkUrl, StoryblokLink } from '@/lib/api/utils/links'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type CardListingImage =
  | AssetStoryblok
  | AssetStoryblok[]
  | StoryblokAsset
  | null
  | undefined

function isAssetStoryblok(value: unknown): value is AssetStoryblok {
  if (!value || typeof value !== 'object') return false
  return (value as AssetStoryblok).component === 'asset'
}

function normalizeAssetBlok(blok: AssetStoryblok): AssetStoryblok {
  const extended = blok as AssetStoryblok & { portrait?: StoryblokAsset | null }
  if (extended.desktop || !extended.portrait) return blok
  return {
    ...blok,
    desktop: extended.portrait as NonNullable<AssetStoryblok['desktop']>,
  }
}

function CardImage({ image }: { image: CardListingImage }) {
  const source = Array.isArray(image) ? image[0] : image
  if (!source) return null

  if (isAssetStoryblok(source)) {
    return <Asset blok={normalizeAssetBlok(source)} size="m" />
  }

  return <Asset asset={source} size="m" />
}

export type CardListingProps = {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  image?: CardListingImage
  href?: string
  link?: StoryblokLink | null
  dark?: boolean
  imageRatio?: 'square' | 'portrait'
  showDownload?: boolean
}

export default function CardListing({
  title,
  subtitle,
  description,
  image,
  href,
  link,
  dark = false,
  imageRatio = 'portrait',
  showDownload = false,
}: CardListingProps) {
  const hasStoryblokLink = Boolean(getLinkUrl(link))
  const hrefValue = href
    ? href.startsWith('/')
      ? href
      : `/${href}`
    : undefined
  const hasLink = Boolean(hasStoryblokLink || hrefValue)
  const inner = (
    <>
      <div className={cn('image', { square: imageRatio === 'square' })}>
        <CardImage image={image} />
      </div>
      <div className={cn('content-wrapper')}>
        <div className={cn('content')}>
          {title ? <h3 className={cn('title')}>{title}</h3> : null}
          {subtitle ? <p className={cn('subtitle')}>{subtitle}</p> : null}
          {showDownload ? (
            <span className={cn('download')} aria-hidden>
              <Icon type="download" size="s" />
            </span>
          ) : null}
          {description ? <p className={cn('description')}>{description}</p> : null}
        </div>
      </div>
    </>
  )

  const className = cn('wrapper', { dark, linked: hasLink })

  if (hasStoryblokLink) {
    return (
      <SmartLink link={link} className={className}>
        {inner}
      </SmartLink>
    )
  }

  if (hrefValue) {
    return (
      <SmartLink href={hrefValue} className={className}>
        {inner}
      </SmartLink>
    )
  }

  return <article className={className}>{inner}</article>
}

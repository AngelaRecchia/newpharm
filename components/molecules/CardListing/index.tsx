import classNames from 'classnames/bind'
import NextImage from 'next/image'
import Asset, { type StoryblokAsset } from '@/components/atoms/Asset'
import Icon from '@/components/atoms/Icon'
import SmartLink from '@/components/atoms/SmartLink'
import ProductTransitionImage from '@/components/atoms/ProductTransitionImage'
import { AssetStoryblok } from '@/types/storyblok'
import { getLinkUrl, StoryblokLink } from '@/lib/api/utils/links'
import { DOWNLOADABLE_PLACEHOLDER_SRC } from '@/lib/downloadable/placeholder'
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

function CardImage({ image, mode }: { image: CardListingImage; mode?: 'bg' | 'fit' }) {
  const source = Array.isArray(image) ? image[0] : image
  if (!source) return null

  if (isAssetStoryblok(source)) {
    return <Asset blok={normalizeAssetBlok(source)} size="m" mode={mode} />
  }

  return <Asset asset={source} size="m" mode={mode} />
}

function hasCardImage(image: CardListingImage): boolean {
  if (!image) return false
  const source = Array.isArray(image) ? image[0] : image
  if (!source) return false
  if (isAssetStoryblok(source)) {
    return Boolean(source.desktop?.filename || source.mobile?.filename)
  }
  return Boolean((source as StoryblokAsset).filename)
}

function toCardHref(href?: string): string | undefined {
  if (!href) return undefined
  if (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('//') ||
    /^https?:\/\//i.test(href)
  ) {
    return href
  }
  return `/${href}`
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
  imageSafeArea?: boolean
  showDownload?: boolean
  onActivate?: () => void
  titleOnlyWhenNoImage?: boolean
  placeholderWhenNoImage?: boolean
  /** uuid story prodotto: morph immagine verso dettaglio */
  productTransitionId?: string
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
  imageSafeArea = false,
  showDownload = false,
  onActivate,
  titleOnlyWhenNoImage = false,
  placeholderWhenNoImage = false,
  productTransitionId,
}: CardListingProps) {
  const hasStoryblokLink = Boolean(getLinkUrl(link))
  const hrefValue = toCardHref(href)
  const hasCover = hasCardImage(image)
  const showImagePlaceholder = placeholderWhenNoImage && !hasCover
  const isInteractive = Boolean(hasStoryblokLink || hrefValue || onActivate)
  const hideMeta = titleOnlyWhenNoImage && !hasCover
  const shownSubtitle = hideMeta ? undefined : subtitle
  const shownDescription = hideMeta ? undefined : description
  const imageClassName = cn('image', {
    square: imageRatio === 'square',
    empty: showImagePlaceholder,
    imageSafeArea: imageSafeArea && hasCover,
  })

  const imageBlock =
    hasCover || showImagePlaceholder ? (
      productTransitionId && hasCover ? (
        <ProductTransitionImage
          uuid={productTransitionId}
          role="source"
          className={imageClassName}
        >
          <CardImage image={image} mode={imageSafeArea ? 'fit' : undefined} />
        </ProductTransitionImage>
      ) : (
        <div
          className={imageClassName}
          aria-hidden={showImagePlaceholder || undefined}
        >
          {hasCover ? (
            <CardImage image={image} mode={imageSafeArea ? 'fit' : undefined} />
          ) : (
            <NextImage
              src={DOWNLOADABLE_PLACEHOLDER_SRC}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={cn('placeholderImage')}
            />
          )}
        </div>
      )
    ) : null

  const inner = (
    <>
      {imageBlock}
      <div className={cn('content-wrapper')}>
        <div className={cn('content')}>
          {title ? <h3 className={cn('title')}>{title}</h3> : null}
          {shownSubtitle ? <p className={cn('subtitle')}>{shownSubtitle}</p> : null}
          {shownDescription ? <p className={cn('description')}>{shownDescription}</p> : null}
          {showDownload ? (
            <span className={cn('download')} aria-hidden>
              <Icon type="download" size="s" />
            </span>
          ) : null}
        </div>
      </div>
    </>
  )

  const className = cn('wrapper', { dark, linked: isInteractive })

  if (onActivate) {
    return (
      <button type="button" className={className} onClick={onActivate}>
        {inner}
      </button>
    )
  }

  if (hasStoryblokLink) {
    return (
      <SmartLink
        link={link}
        className={className}
        productTransitionId={productTransitionId}
        data-product-card
      >
        {inner}
      </SmartLink>
    )
  }

  if (hrefValue) {
    return (
      <SmartLink
        href={hrefValue}
        className={className}
        productTransitionId={productTransitionId}
        data-product-card
      >
        {inner}
      </SmartLink>
    )
  }

  return (
    <article className={className} data-product-card>
      {inner}
    </article>
  )
}

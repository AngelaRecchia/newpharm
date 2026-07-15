'use client'

import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import BoxImage from '@/components/organisms/BoxImage'
import { isEmpty } from '@/lib/api/utils/links'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { Box_image_carouselStoryblok, Box_imageStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles)

const BoxImageCarousel = ({ blok }: { blok?: Box_image_carouselStoryblok }) => {
  if (!blok) return <></>

  const { title, items, anchor_id } = blok
  const hasTitle = !isEmpty(title)
  const boxImages = (items ?? []).filter(
    (item): item is Box_imageStoryblok => item?.component === 'box_image'
  )

  if (boxImages.length === 0 && !hasTitle) return <></>

  return (
    <div className={cn('wrapper')} id={getStoryblokAnchorId(anchor_id)} {...storyblokEditable(blok as any)}>
      {hasTitle && (
        <div className={cn('head-container')}>
          <div className={cn('head')}>
            <h2 className={cn('title')}>{title}</h2>
          </div>
        </div>
      )}

      {boxImages.map((item) => (
        <BoxImage key={item._uid} blok={item as any} variant="carousel" />
      ))}
    </div>
  )
}

export default BoxImageCarousel

'use client'

import { useCallback, useState } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide, type SwiperClass } from 'swiper/react'
import 'swiper/swiper.css'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import { isEmpty } from '@/lib/api/utils/links'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { GalleryStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const Gallery = ({ blok }: { blok?: GalleryStoryblok }) => {
  const { title, images, theme } = blok || {}
  const navId = blok?._uid ?? 'gallery'
  const isDark = theme === 'dark'
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState((images?.length ?? 0) <= 1)

  const syncNav = useCallback((swiper: SwiperClass) => {
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
  }, [])

  if (!blok) return <></>

  const hasTitle = !isEmpty(title)

  return (
    <section
      className={cn('wrapper', { dark: isDark })}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as any)}
    >
      <div className={cn('container')}>
        <div className={cn('content')}>
          {hasTitle && (
            <div className={cn('head')}>
              <h2 className={cn('title')}>{title}</h2>
            </div>
          )}

          {images && images.length > 0 && (
            <div className={cn('swiper-wrapper')}>
              <div className={cn('buttons-wrapper')}>
                <Button
                  className={`gallery-prev-${navId}`}
                  icon="chevron-left"
                  variant="tertiary"
                  weight="normal"
                  animated
                  disabled={isBeginning}
                  aria-label="Previous slide"
                />
                <Button
                  className={`gallery-next-${navId}`}
                  icon="chevron-right"
                  variant="tertiary"
                  weight="normal"
                  animated
                  disabled={isEnd}
                  aria-label="Next slide"
                />
              </div>

              <Swiper
                spaceBetween={16}
                modules={[Navigation, Pagination]}
                slidesPerView="auto"
                initialSlide={0}
                watchOverflow
                simulateTouch
                grabCursor
                touchReleaseOnEdges
                className={cn('swiper')}
                pagination={{ clickable: true }}
                navigation={{
                  prevEl: `.gallery-prev-${navId}`,
                  nextEl: `.gallery-next-${navId}`,
                }}
                onSwiper={syncNav}
                onProgress={syncNav}
                onSlideChange={syncNav}
                onResize={syncNav}
              >
                {images.map((image: any, index: number) => (
                  <SwiperSlide key={image._uid ?? `gallery-${index}`} className={cn('swiper-slide')}>
                    <div className={cn('image-item')}>
                      <Asset asset={image} size="m" mode="fit" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Gallery

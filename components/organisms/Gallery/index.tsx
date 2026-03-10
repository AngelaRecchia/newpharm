'use client'

import { useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { GalleryStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import Button from '@/components/atoms/Button'
import { Navigation, Pagination } from 'swiper/modules'
import { isEmpty } from '@/lib/api/utils/links'

const cn = classNames.bind(styles)

const Gallery = ({ blok }: { blok?: GalleryStoryblok }) => {
    const { title, images } = blok || {}
    const prevRef = useRef<HTMLButtonElement>(null)
    const nextRef = useRef<HTMLButtonElement>(null)

    if (!blok) return <></>

    const hasTitle = !isEmpty(title)

    return (
        <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                <div className={cn('content')}>
                    {hasTitle && (
                        <div className={cn('head')}>
                            <h2 className={cn('title')}>{title}</h2>
                        </div>
                    )}

                    {images && images.length > 0 && (
                        <div className={cn('swiper-wrapper')}>
                            <Swiper
                                spaceBetween={16}
                                modules={[Navigation, Pagination]}
                                slidesPerView='auto'
                                initialSlide={0}
                                className={cn('swiper')}
                                pagination={{ clickable: true }}
                                onInit={(swiper) => {
                                    if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                                        swiper.params.navigation.prevEl = prevRef.current
                                        swiper.params.navigation.nextEl = nextRef.current
                                    }
                                    swiper.navigation.init()
                                    swiper.navigation.update()
                                }}
                            >
                                {images.map((image: any) => (
                                    <SwiperSlide key={image._uid} className={cn('swiper-slide')}>
                                        <div className={cn('image-item')}>
                                            <Asset asset={image} size="m" mode="fit" />
                                        </div>
                                    </SwiperSlide>
                                ))}

                                <div className={cn('buttons-wrapper')}>
                                    <Button ref={prevRef} className={cn('button-prev')} icon='chevron-left' variant='tertiary' weight='normal' animated={true} aria-label="Previous slide" />
                                    <Button ref={nextRef} className={cn('button-next')} icon='chevron-right' variant='tertiary' weight='normal' animated={true} aria-label="Next slide" />
                                </div>


                            </Swiper>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default Gallery

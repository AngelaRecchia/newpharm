'use client'

import { useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import { SlideshowStoryblok, Card_slideshowStoryblok } from '@/types/storyblok'
import { isLinkStoryblokValid } from '@/lib/api/utils/links'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import GlossaryText from '@/components/atoms/GlossaryText'

const cn = classNames.bind(styles)

export default function Slideshow({ blok }: { blok?: SlideshowStoryblok }) {
    const prevRef = useRef<HTMLButtonElement>(null)
    const nextRef = useRef<HTMLButtonElement>(null)

    if (!blok) {
        return <></>
    }

    const { title, cards } = blok



    return (
        <section className={cn('wrapper')} id={getStoryblokAnchorId(blok.anchor_id)} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                {title && (
                    <div className={cn('head')}>
                        <h2 className={cn('title')}>{title}</h2>


                        <div className={cn('buttons-wrapper')}>
                            <Button
                                ref={prevRef}
                                className={cn('button-prev')}

                                icon="chevron-left"
                                variant="tertiary"
                                weight="normal"
                                animated={true}
                                aria-label="Previous slide"
                            />
                            <Button
                                ref={nextRef}
                                className={cn('button-next')}
                                icon="chevron-right"
                                variant="tertiary"
                                weight="normal"
                                animated={true}
                                aria-label="Next slide"
                            />
                        </div>
                    </div>
                )}

                {cards && cards.length > 0 && (
                    <div className={cn('slideshow-wrapper')}>
                        <Swiper
                            spaceBetween={16}
                            modules={[Navigation]}
                            slidesPerView={1}
                            className={cn('swiper')}
                            onInit={(swiper) => {
                                if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                                    swiper.params.navigation.prevEl = prevRef.current
                                    swiper.params.navigation.nextEl = nextRef.current
                                }
                                swiper.navigation.init()
                                swiper.navigation.update()
                            }}
                        >
                            {cards?.map((card: Card_slideshowStoryblok) => {
                                const links = (card.link ?? []).filter(isLinkStoryblokValid)

                                return (
                                    <SwiperSlide key={card._uid} className={cn('swiper-slide')}>
                                        <article className={cn('card')}>
                                            {card.image && (
                                                <div className={cn('card-image')}>
                                                    <Asset
                                                        asset={
                                                            Array.isArray(card.image)
                                                                ? card.image[0]
                                                                : card.image
                                                        }
                                                        size="m"
                                                    />
                                                </div>
                                            )}
                                            {(card.text || links.length > 0) && (
                                                <div className={cn('card-text')}>
                                                    {card.text ? (
                                                        <GlossaryText text={card.text} />
                                                    ) : null}

                                                    {links.map((linkItem) => (
                                                        <div key={linkItem._uid} className={cn('card-link')}>
                                                            <Button
                                                                link={linkItem}
                                                                variant="secondary"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    </SwiperSlide>
                                )
                            })}

                        </Swiper>
                    </div>
                )}
            </div>
        </section>
    )
}

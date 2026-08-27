'use client'

import { HeroStoryblok } from '@/types/storyblok'
import Asset from '@/components/atoms/Asset'
import styles from './index.module.scss'
import classNames from 'classnames/bind'
import { useMemo, useRef, type CSSProperties } from 'react'
import AnchorLink from '@/components/atoms/AnchorLink'
import Button from '@/components/atoms/Button'
import { storyblokEditable } from '@storyblok/react'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useStickyParallax } from '@/lib/animation/useStickyParallax'
import GlossaryText from '@/components/atoms/GlossaryText'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

const cn = classNames.bind(styles)

export default function HeroComponent({ blok }: { blok?: HeroStoryblok }) {
    const wrapperRef = useRef<HTMLElement>(null)
    const backgroundRef = useRef<HTMLDivElement>(null)

    const backgroundAsset = blok?.background?.length ? blok.background[0] : null
    const hasStickyBackground = !!blok && blok.variant !== 'tertiary' && !!backgroundAsset

    useStickyParallax(wrapperRef, backgroundRef, [blok?.variant, backgroundAsset], {
        enabled: hasStickyBackground,
    })

    const renderLinks = useMemo(() => {
        if (!blok) return null
        const { links, variant } = blok
        if (variant === 'primary') {
            return links?.map((link) => (
                <Button key={link._uid} link={link} variant='secondary' />
            ))
        }

        if (variant === 'secondary') {
            return (
                <Swiper
                    spaceBetween={8}
                    slidesPerView='auto'
                    className={cn('swiper')}
                    style={{ '--hero-link-count': links?.length ?? 1 } as CSSProperties}
                >
                    {links?.map((link) => (
                        <SwiperSlide key={link._uid} className={cn('swiper-slide')}>
                            <AnchorLink
                                link={link.link}
                                label={link.label}
                                description={link.description}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )
        }

        return null
    }, [blok])

    if (!blok) return null

    const { title, subtitle, links, variant } = blok

    const content = (
        <>
            <div className={cn('content')}>
                <h1 className={cn('title')}>{title}</h1>
                {subtitle ? (
                    <p className={cn('subtitle')}>
                        {variant === 'tertiary' ? <GlossaryText text={subtitle} /> : subtitle}
                    </p>
                ) : null}
            </div>

            {links && links.length > 0 ? <div className={cn('links')}>{renderLinks}</div> : null}
        </>
    )

    return (
        <section
            ref={wrapperRef}
            className={cn('wrapper', variant)}
            id={getStoryblokAnchorId(blok.anchor_id)}
            {...storyblokEditable(blok as any)}
        >
            {hasStickyBackground && backgroundAsset ? (
                <div className={cn('scene')}>
                    <div ref={backgroundRef} className={cn('background')}>
                        <Asset blok={backgroundAsset} priority={true} size='xl' />
                    </div>

                    <div className={cn('foreground')}>
                        <div className={cn('container')}>{content}</div>
                    </div>
                </div>
            ) : (
                <div className={cn('container')}>{content}</div>
            )}
        </section>
    )
}

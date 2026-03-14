'use client'

import { useEffect, useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import SmartLink from '@/components/atoms/SmartLink'
import { AssetStoryblok, LinkStoryblok } from '@/types/storyblok'
import { StoryblokLink, isEmpty, isLinkEmpty } from '@/lib/api/utils/links'

const cn = classNames.bind(styles)

interface CardHighlight {
    image?: AssetStoryblok[] | null
    text?: string | null
    link?: StoryblokLink & { anchor?: string } | null
    _uid: string
    component: string
    _editable?: string
}

interface ProjectsHighlightStoryblok {
    title?: string | null
    link?: LinkStoryblok[]
    cards?: CardHighlight[] | null
    _uid: string
    component: string
    _editable?: string
}

export default function ProjectsHighlight({ blok }: { blok?: ProjectsHighlightStoryblok }) {
    const cardsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!cardsRef.current) return

        const images = Array.from(cardsRef.current.querySelectorAll<HTMLElement>(`.${cn('card-image')}`))
        if (!images.length) return

        let rafId: number | null = null
        const PARALLAX = 16 // % di spostamento massimo

        const onScroll = () => {
            if (rafId !== null) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                const vh = window.innerHeight
                images.forEach((el) => {
                    const rect = el.getBoundingClientRect()
                    // progress 0 = elemento entra dal basso, 1 = esce dall'alto
                    const progress = 1 - (rect.top + rect.height) / (vh + rect.height)
                    const clamped = Math.min(1, Math.max(0, progress))
                    // da +PARALLAX% a -PARALLAX%
                    const y = PARALLAX - clamped * PARALLAX * 2
                    el.style.transform = `translateY(${y}%)`
                })
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll() // posizione iniziale

        return () => {
            window.removeEventListener('scroll', onScroll)
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [blok?.cards])

    if (!blok) {
        return <></>
    }

    const { title, link, cards } = blok;

    return (
        <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                {(title || link) && (
                    <div className={cn('head')}>
                        {title && <h2 className={cn('title')}>{title}</h2>}
                        {link && (
                            <div className={cn('link')}>
                                <Button link={link} />
                            </div>
                        )}
                    </div>
                )}


                <div ref={cardsRef} className={cn('cards')}>
                    {cards?.map((card) => {




                        return (
                            <div key={card._uid} className={cn('card')}>


                                {card.image?.map((image, index) => (
                                    <div key={image._uid || `image-${index}`} className={cn('card-image')}>
                                        <Asset blok={image} size="l" />
                                    </div>
                                ))}
                                <SmartLink link={card.link} className={cn('card-link')}>
                                    <div className={cn('card-text')}>{card.text}</div>
                                    {card.link && !isLinkEmpty(card.link) && <Button className={cn('card-button')} link={card.link} inert={true} />}
                                </SmartLink>

                            </div>

                        )
                    })}
                </div>
            </div>
        </section>
    )
}

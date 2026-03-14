'use client'

import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Button from '@/components/atoms/Button'
import { isEmpty } from '@/lib/api/utils/links'
import { MilestoneStoryblok } from '@/types/storyblok'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { SmoothScrollContext } from '@/lib/context/smooth-scroll-context'

const cn = classNames.bind(styles)

const ITEMS_PER_PAGE = 6

const Milestone = ({ blok }: { blok?: MilestoneStoryblok }) => {
    const t = useTranslations('')
    const { lenis } = useContext(SmoothScrollContext)
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
    const itemsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!itemsRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(cn('is-visible'))
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.60 }
        )

        const items = itemsRef.current.querySelectorAll(`.${cn('item')}`)
        items.forEach((item) => observer.observe(item))

        return () => observer.disconnect()
    }, [visibleCount])

    if (!blok) return <></>

    const { title, items } = blok
    const totalItems = items?.length ?? 0
    const hasMore = totalItems > visibleCount
    const visibleItems = items?.slice(0, visibleCount)

    return (
        <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                {!isEmpty(title) && (
                    <div className={cn('head')}>
                        <p className={cn('title')}>{title}</p>
                    </div>
                )}

                {visibleItems && visibleItems.length > 0 && (
                    <div ref={itemsRef} className={cn('items')}>
                        {visibleItems.map((item, index) => (
                            <div key={item._uid} className={cn('item')} style={{ '--i': index % ITEMS_PER_PAGE } as React.CSSProperties}>
                                <div className={cn('item-container')}>
                                    <div className={cn('item-title__wrapper')}>
                                        <h3 className={cn('item-title')}>{item.title}</h3>
                                    </div>
                                    <div className={cn('item-text__wrapper')}>
                                        <p className={cn('item-text')}>{item.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className={cn('footer')}>
                        <Button
                            variant="tertiary"
                            label={t('see_all')}
                            onClick={() => {
                                setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
                                requestAnimationFrame(() => lenis?.resize())
                            }}
                            icon="more"
                        />
                    </div>
                )}
            </div>
        </section>
    )
}

export default Milestone

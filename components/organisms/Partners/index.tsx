'use client'

import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import { PartnersStoryblok, Logo_itemStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles)

export default function Partners({ blok }: { blok?: PartnersStoryblok }) {
    if (!blok) {
        return <></>
    }

    const { title, variant, items } = blok
    const isDark = variant === 'dark'

    return (
        <section className={cn('wrapper', { dark: isDark })} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                {title && (
                    <div className={cn('head')}>
                        <h2 className={cn('title')}>{title}</h2>
                    </div>
                )}

                {items && items.length > 0 && (
                    <div className={cn('items')}>
                        {items.map((item: Logo_itemStoryblok) => (
                            <div key={item._uid} className={cn('item')}>
                                <div className={cn('item-logo')}>
                                    {!isDark ?
                                        item.logo_light && (
                                            <div className={cn('logo-light')}>
                                                <Asset asset={item.logo_light} size="s" mode="fit" alt={!!item.description?.length ? item.description : item.logo_light.alt || ''} />
                                            </div>
                                        ) : (
                                            item.logo_dark && (
                                                <div className={cn('logo-dark')}>
                                                    <Asset asset={item.logo_dark} size="s" mode="fit" />
                                                </div>
                                            )
                                        )}

                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

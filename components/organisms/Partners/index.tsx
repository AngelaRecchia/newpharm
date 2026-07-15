'use client'

import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
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
        <section className={cn('wrapper', { dark: isDark })} id={getStoryblokAnchorId(blok.anchor_id)} {...storyblokEditable(blok as any)}>
            <div className={cn('container')}>
                {title && (
                    <div className={cn('head')}>
                        <h2 className={cn('title')}>{title}</h2>
                    </div>
                )}

                {items && items.length > 0 && (
                    <div className={cn('items')}>
                        {items.map((item: Logo_itemStoryblok) => {
                            const logoLight = Array.isArray(item.logo_light)
                                ? item.logo_light[0]
                                : item.logo_light
                            const logoDark = Array.isArray(item.logo_dark)
                                ? item.logo_dark[0]
                                : item.logo_dark
                            const lightAlt =
                                item.description && item.description.length > 0
                                    ? item.description
                                    : (logoLight as { alt?: string } | undefined)?.alt || ''

                            return (
                                <div key={item._uid} className={cn('item')}>
                                    <div className={cn('item-logo')}>
                                        {!isDark ? (
                                            logoLight && (
                                                <div className={cn('logo-light')}>
                                                    <Asset asset={logoLight} size="s" mode="fit" alt={lightAlt} />
                                                </div>
                                            )
                                        ) : (
                                            logoDark && (
                                                <div className={cn('logo-dark')}>
                                                    <Asset asset={logoDark} size="s" mode="fit" />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}

'use client'

import { useEffect, useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import SmartLink from '@/components/atoms/SmartLink'
import { AssetStoryblok, LinkStoryblok } from '@/types/storyblok'
import { isEmpty, isLinkEmpty } from '@/lib/api/utils/links'
import { useViewport } from '@/lib/context/viewport-context'

const cn = classNames.bind(styles)

interface BoxImageStoryblok {
    /** Array di asset (immagini o video). Viene utilizzato solo il primo elemento. */
    asset?: AssetStoryblok[] | null
    title?: string | null
    subtitle?: string | null
    link?: LinkStoryblok[]
    image_alignment?: 'left' | 'right' | null
    _uid: string
    component: string
    _editable?: string
}

const BoxImage = ({
    blok,
    variant = 'default',
}: {
    blok?: BoxImageStoryblok
    variant?: 'default' | 'carousel'
}) => {
    const wrapperRef = useRef<HTMLElement>(null)
    const contentWrapperRef = useRef<HTMLDivElement>(null)
    const { untilMd } = useViewport()

    const { asset, title, subtitle, link, image_alignment = 'left' } = blok ?? {}
    const linkBlok = link?.[0]
    const hasTitle = !isEmpty(title)
    const hasSubtitle = !isEmpty(subtitle)
    // Il link è valido se esiste e ha un link interno valido (non serve la label)
    const hasLink = linkBlok && !isLinkEmpty(linkBlok.link)

    // Prende solo il primo asset dall'array (supporta sia immagini che video)
    const firstAsset = asset && asset.length > 0 ? asset[0] : null
    const buttonVariant = variant === 'carousel' ? 'primary' : 'secondary'

    // Desktop: altezza immagine >= colonna testo (mantiene sticky + 50dvw minimo)
    useEffect(() => {
        if (untilMd || !wrapperRef.current || !contentWrapperRef.current) return

        const wrapper = wrapperRef.current
        const contentWrapper = contentWrapperRef.current

        const syncContentHeight = () => {
            wrapper.style.setProperty('--content-height', `${contentWrapper.offsetHeight}px`)
        }

        syncContentHeight()

        const observer = new ResizeObserver(syncContentHeight)
        observer.observe(contentWrapper)

        return () => observer.disconnect()
    }, [untilMd, hasTitle, hasSubtitle, hasLink, title, subtitle, link])

    // Gestione hover per effetti su link
    useEffect(() => {
        if (!hasLink || untilMd || !contentWrapperRef.current) return

        const contentWrapper = contentWrapperRef.current
        const wrapper = wrapperRef.current

        const handleMouseEnter = () => {
            if (wrapper) wrapper.classList.add(cn('is-hovered'))
        }

        const handleMouseLeave = () => {
            if (wrapper) wrapper.classList.remove(cn('is-hovered'))
        }

        contentWrapper.addEventListener('mouseenter', handleMouseEnter)
        contentWrapper.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            contentWrapper.removeEventListener('mouseenter', handleMouseEnter)
            contentWrapper.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [hasLink, untilMd])

    if (!blok) return <></>

    return (
        <section
            ref={wrapperRef}
            className={cn('wrapper', {
                carousel: variant === 'carousel',
                'has-link': hasLink,
                'image-alignment-right': image_alignment === 'right',
            })}
            {...storyblokEditable(blok as any)}
            data-box-image
        >
            <div className={cn('container')}>
                {firstAsset && (
                    <div className={cn('asset-wrapper')}>
                        <Asset blok={firstAsset} size="m" />
                    </div>
                )}

                <div ref={contentWrapperRef} className={cn('content-wrapper')}>
                    {hasLink ? (
                        <SmartLink link={linkBlok}>
                            <div className={cn('content')}>
                                {hasTitle && <h2 className={cn('title')}>{title}</h2>}
                                {hasSubtitle && <p className={cn('subtitle')}>{subtitle}</p>}
                                <div className={cn('link-wrapper')}>
                                    <Button
                                        blok={linkBlok}
                                        link={linkBlok}
                                        variant={buttonVariant}
                                        inert
                                    />
                                </div>
                            </div>
                        </SmartLink>
                    ) : (
                        <div className={cn('content')}>
                            {hasTitle && <h2 className={cn('title')}>{title}</h2>}
                            {hasSubtitle && <p className={cn('subtitle')}>{subtitle}</p>}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default BoxImage

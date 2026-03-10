'use client'

import { useEffect, useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import SmartLink from '@/components/atoms/SmartLink'
import { AssetStoryblok, LinkStoryblok } from '@/types/storyblok'
import { isEmpty, isLinkStoryblokValid } from '@/lib/api/utils/links'
import { useViewport } from '@/lib/context/viewport-context'

const cn = classNames.bind(styles)

interface BoxImageStoryblok {
    /** Array di asset (immagini o video). Viene utilizzato solo il primo elemento. */
    asset?: AssetStoryblok[] | null
    title?: string | null
    subtitle?: string | null
    link?: LinkStoryblok
    orientation?: 'left' | 'right' | null
    _uid: string
    component: string
    _editable?: string
}

const BoxImage = ({ blok }: { blok?: BoxImageStoryblok }) => {
    const wrapperRef = useRef<HTMLElement>(null)
    const contentWrapperRef = useRef<HTMLDivElement>(null)
    const { isDesktop } = useViewport()

    if (!blok) return <></>

    const { asset, title, subtitle, link, orientation = 'left' } = blok
    const hasTitle = !isEmpty(title)
    const hasSubtitle = !isEmpty(subtitle)
    const hasLink = isLinkStoryblokValid(link)
    // Prende solo il primo asset dall'array (supporta sia immagini che video)
    const firstAsset = asset && asset.length > 0 ? asset[0] : null
    const isRightOriented = orientation === 'right'

    // Estrae il link Storyblok dal LinkStoryblok
    const storyblokLink = hasLink && link?.link ? link.link : null

    const ContentWrapper = hasLink && storyblokLink ? SmartLink : 'div'
    const contentWrapperProps = hasLink && storyblokLink ? { link: storyblokLink } : {}

    // Gestione hover per effetti su link
    useEffect(() => {
        if (!hasLink || !isDesktop || !contentWrapperRef.current) return

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
    }, [hasLink, isDesktop, cn])


    // Calcola l'altezza del content-wrapper e imposta la variabile CSS
    useEffect(() => {
        if (!contentWrapperRef.current || !wrapperRef.current || isDesktop) return

        const contentWrapper = contentWrapperRef.current
        const wrapper = wrapperRef.current

        const updateContentHeight = () => {
            const height = contentWrapper.offsetHeight
            wrapper.style.setProperty('--content-height', `${height}px`)
            const nextSibling = wrapper.nextElementSibling as HTMLElement
            if (nextSibling) nextSibling.style.setProperty('--content-height', `${height}px`)
        }

        // Calcola inizialmente
        updateContentHeight()

        // Ricalcola su resize del content-wrapper
        const resizeObserver = new ResizeObserver(updateContentHeight)
        resizeObserver.observe(contentWrapper)

        return () => {
            resizeObserver.disconnect()
        }
    }, [isDesktop])


    return (
        <section
            ref={wrapperRef}
            className={cn('wrapper', {
                'has-link': hasLink,
                'orientation-right': isRightOriented
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
                    <ContentWrapper {...contentWrapperProps}>
                        <div className={cn('content')}>
                            {hasTitle && <h2 className={cn('title')}>{title}</h2>}
                            {hasSubtitle && <p className={cn('subtitle')}>{subtitle}</p>}

                            {hasLink && storyblokLink && (
                                <div className={cn('link-wrapper')}>
                                    <Button link={storyblokLink} variant="secondary" inert={true} />
                                </div>
                            )}
                        </div>
                    </ContentWrapper>
                </div>
            </div>
        </section>
    )
}

export default BoxImage

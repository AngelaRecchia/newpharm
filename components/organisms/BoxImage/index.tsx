'use client'

import { useEffect, useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import SmartLink from '@/components/atoms/SmartLink'
import { Box_imageStoryblok, LinkStoryblok } from '@/types/storyblok'
import { isEmpty } from '@/lib/api/utils/links'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { useViewport } from '@/lib/context/viewport-context'
import GlossaryText from '@/components/atoms/GlossaryText'
import { resolveBoxImageContent } from '@/lib/box-image/resolveBoxImageContent'

const cn = classNames.bind(styles)

function editorialButtonVariant(linkBlok?: LinkStoryblok) {
    if (linkBlok?.variant === 'black') return 'secondary' as const
    if (linkBlok?.variant === 'blue') return 'primary' as const
    return undefined
}

const BoxImage = ({
    blok,
    variant = 'default',
}: {
    blok?: Box_imageStoryblok
    variant?: 'default' | 'carousel'
}) => {
    const wrapperRef = useRef<HTMLElement>(null)
    const contentWrapperRef = useRef<HTMLDivElement>(null)
    const { untilMd } = useViewport()

    const resolved = blok ? resolveBoxImageContent(blok) : null
    const title = resolved?.title ?? null
    const subtitle = resolved?.subtitle ?? null
    const firstAsset = resolved?.firstAsset ?? null
    const href = resolved?.href ?? null
    const linkBlok = resolved?.linkBlok
    const clickTarget = resolved?.clickTarget ?? null
    const image_alignment = blok?.image_alignment ?? 'left'
    const anchor_id = blok?.anchor_id

    const hasTitle = !isEmpty(title)
    const hasSubtitle = !isEmpty(subtitle)
    const hasCta = clickTarget !== null

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
    }, [untilMd, hasTitle, hasSubtitle, hasCta, title, subtitle, href, linkBlok])

    if (!blok) return <></>

    const titleNode = hasTitle && (
        <h2 className={cn('title')}>
            {variant === 'carousel' ? title : <GlossaryText text={title} />}
        </h2>
    )

    const subtitleNode = hasSubtitle && (
        <p className={cn('subtitle')}>
            <GlossaryText text={subtitle} />
        </p>
    )

    const buttonVariant = editorialButtonVariant(linkBlok) ?? (!linkBlok ? 'secondary' : undefined)

    const cta =
        clickTarget === 'module' ? (
            <div className={cn('link-wrapper')}>
                <Button variant={buttonVariant} inert />
            </div>
        ) : clickTarget === 'button' ? (
            <div className={cn('link-wrapper')}>
                <Button
                    blok={linkBlok}
                    link={linkBlok}
                    variant={buttonVariant}
                />
            </div>
        ) : null

    const inner = (
        <div className={cn('container')}>
            {firstAsset && (
                <div className={cn('asset-wrapper')}>
                    <Asset blok={firstAsset} size="l" />
                </div>
            )}

            <div ref={contentWrapperRef} className={cn('content-wrapper')}>
                <div className={cn('content')}>
                    {titleNode}
                    {subtitleNode}
                    {cta}
                </div>
            </div>
        </div>
    )

    return (
        <section
            ref={wrapperRef}
            id={getStoryblokAnchorId(anchor_id)}
            className={cn('wrapper', {
                carousel: variant === 'carousel',
                'has-module-link': clickTarget === 'module',
                'image-alignment-right': image_alignment === 'right',
            })}
            {...storyblokEditable(blok as any)}
            data-box-image
        >
            {clickTarget === 'module' && (
                <SmartLink
                    href={href ?? undefined}
                    className={cn('module-link')}
                    aria-label={title ?? undefined}
                />
            )}
            {inner}
        </section>
    )
}

export default BoxImage

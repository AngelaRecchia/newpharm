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



const BoxImage = ({ blok }: { blok?: BoxImageStoryblok }) => {

    const wrapperRef = useRef<HTMLElement>(null)

    const contentWrapperRef = useRef<HTMLDivElement>(null)

    const { untilMd } = useViewport()



    const { asset, title, subtitle, link, image_alignment = 'left' } = blok ?? {}

    const hasTitle = !isEmpty(title)

    const hasSubtitle = !isEmpty(subtitle)

    // Il link è valido se esiste e ha un link interno valido (non serve la label)

    const hasLink = link && !isLinkEmpty(link[0]?.link)



    // Prende solo il primo asset dall'array (supporta sia immagini che video)

    const firstAsset = asset && asset.length > 0 ? asset[0] : null



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



    // Calcola l'altezza del content-wrapper e imposta la variabile CSS

    useEffect(() => {

        if (!contentWrapperRef.current || !wrapperRef.current || !untilMd) return



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

    }, [untilMd])



    if (!blok) return <></>



    return (

        <section

            ref={wrapperRef}

            className={cn('wrapper', {

                'has-link': hasLink,

                'image-alignment-right': image_alignment === 'right'

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

                        <SmartLink link={link as any}>

                            <div className={cn('content')}>

                                {hasTitle && <h2 className={cn('title')}>{title}</h2>}

                                {hasSubtitle && <p className={cn('subtitle')}>{subtitle}</p>}

                                <div className={cn('link-wrapper')}>

                                    <Button link={link} variant="secondary" inert={true} />

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


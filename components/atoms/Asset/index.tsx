'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import NextImage, { ImageProps as NextImageProps } from 'next/image'
import classNames from 'classnames/bind'
import { useViewport } from '@/lib/context/viewport-context'
import Icon from '@/components/atoms/Icon'
import styles from './index.module.scss'
import Button from '../Button'
import { useTranslations } from 'next-intl'

const cn = classNames.bind(styles)

type AssetSize = 's' | 'm' | 'l'

/**
 * Mappa delle dimensioni per il servizio immagini Storyblok.
 * Ogni size ha due valori: [fromLg, untilLg]
 */
const sizeMap: Record<AssetSize, { fromLg: number; untilLg: number }> = {
    s: { fromLg: 640, untilLg: 320 },
    m: { fromLg: 1280, untilLg: 640 },
    l: { fromLg: 1920, untilLg: 968 },
}

/**
 * Estensioni video supportate
 */
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'ogg', 'avi', 'mkv']

/**
 * Estensioni immagini supportate
 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']

/**
 * Tipo per l'asset Storyblok
 */
export interface StoryblokAsset {
    id?: number
    alt?: string
    name?: string
    focus?: string
    title?: string
    filename: string
    copyright?: string
    fieldtype?: string
}

/**
 * Determina se l'URL è un video o un'immagine basandosi sull'estensione
 */
export function getFileType(src: string): 'video' | 'image' | 'unknown' {
    const extension = src.split('.').pop()?.toLowerCase() || ''

    if (VIDEO_EXTENSIONS.includes(extension)) {
        return 'video'
    }

    if (IMAGE_EXTENSIONS.includes(extension)) {
        return 'image'
    }

    return 'unknown'
}

interface AssetComponentProps extends Omit<NextImageProps, 'src' | 'alt'> {
    /** URL sorgente dell'asset (immagine o video) - retrocompatibilità */
    src?: string
    /** Testo alternativo - retrocompatibilità */
    alt?: string
    /** Asset Storyblok completo (ha priorità su src/alt) */
    asset?: StoryblokAsset | null
    /** Dimensione dell'immagine: 's' | 'm' | 'l' (solo per immagini) */
    size?: AssetSize
    /** Classe CSS aggiuntiva */
    className?: string
    /** Props aggiuntive per il tag video */
    videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>
    /** Mostra un overlay con opacità 0.4 */
    overlay?: boolean
    /** Nasconde i controlli del video */
    hideControls?: boolean
}

/**
 * Componente Asset che renderizza automaticamente immagini o video
 * basandosi sull'estensione del file.
 * 
 * Per le immagini: applica le trasformazioni Storyblok in base al viewport.
 * Per i video: renderizza un tag video standard.
 *
 * @example
 * ```tsx
 * // Con asset Storyblok (consigliato)
 * <Asset asset={background} size="l" fill />
 * 
 * // Con src/alt (retrocompatibilità)
 * <Asset src="https://a.storyblok.com/f/.../asset.jpg" size="l" alt="Hero" fill />
 * 
 * // Video
 * <Asset asset={videoAsset} className="hero-video" />
 * ```
 */
const Asset = ({
    src,
    alt,
    asset,
    size = 'l',
    className,
    videoProps,
    overlay = false,
    hideControls = false,
    ...rest
}: AssetComponentProps) => {
    const { isDesktop } = useViewport()
    const t = useTranslations()

    // Se c'è un asset Storyblok, usa quello, altrimenti usa src/alt
    const assetSrc = asset?.filename || src || ''
    const assetAlt = asset?.alt || alt || ''

    const fileType = useMemo(() => getFileType(assetSrc), [assetSrc])

    // Hooks devono essere chiamati sempre, non condizionalmente
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(true)

    const handleTogglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }, [isPlaying])

    // Se è un video, renderizza il tag video con bottone play/pause
    if (fileType === 'video') {

        return (
            <div className={cn('asset-video-wrapper', { assetHasOverlay: overlay }, className)}>
                <video
                    data-asset
                    ref={videoRef}
                    src={assetSrc}
                    className={cn('asset', 'asset-video')}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    {...videoProps}
                />
                {!hideControls && (
                    <Button
                        data-video-controls
                        onClick={handleTogglePlay}
                        className={cn('asset-video-control')}
                        aria-label={isPlaying ? t('pause') : t('play')}
                        icon={isPlaying ? 'pause' : 'play'}
                        variant='tertiary'
                    />
                )}
            </div>
        )
    }

    // Se è un'immagine, applica la logica del suffix
    if (fileType === 'image') {
        const dimensions = sizeMap[size]
        const suffix = isDesktop ? dimensions.fromLg : dimensions.untilLg
        const transformedSrc = `${assetSrc}/m/${suffix}x0`

        return (
            <div className={cn('asset-image-wrapper', { assetHasOverlay: overlay }, className)} data-asset>
                <NextImage
                    src={transformedSrc}
                    alt={assetAlt}
                    className={cn('asset', 'asset-image')}
                    fill
                    objectFit='cover'
                    quality={100}
                    {...rest}
                />
            </div>
        )
    }

    // Fallback per tipo sconosciuto (renderizza come immagine senza trasformazioni)
    return (
        <div className={cn('asset-image-wrapper', { assetHasOverlay: overlay }, className)} data-asset>
            <NextImage
                src={assetSrc}
                alt={assetAlt}
                className={cn('asset', 'asset-image')}
                fill
                objectFit='cover'
                quality={100}
                {...rest}
            />
        </div>
    )
}

export default Asset

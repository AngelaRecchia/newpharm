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
 * Tipo per asset con mobile/desktop (componente Storyblok)
 */
export interface StoryblokAssetWithBreakpoints {
    mobile?: StoryblokAsset | null
    desktop?: StoryblokAsset | null
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

export interface AssetComponentProps extends Omit<NextImageProps, 'src' | 'alt'> {
    /** URL sorgente dell'asset (immagine o video) - retrocompatibilità */
    src?: string
    /** Testo alternativo - retrocompatibilità */
    alt?: string
    /** 
     * Asset Storyblok: può essere un asset diretto, un array di assets, o un oggetto con mobile/desktop
     * - Asset diretto: { filename: "...", alt: "..." }
     * - Array di assets: [{ filename: "..." }, ...] - renderizza il primo elemento
     * - Asset con breakpoints: { mobile: {...}, desktop: {...} }
     */
    asset?: StoryblokAsset | StoryblokAsset[] | StoryblokAssetWithBreakpoints | null
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
    /** Modalità di rendering: 'bg' = background (absolute), 'fit' = fit content (no absolute) */
    mode?: 'bg' | 'fit'
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
    mode = 'bg',
    ...rest
}: AssetComponentProps) => {
    const { isDesktop } = useViewport()
    const t = useTranslations()

    // Logica per determinare quale asset usare
    // Priorità: asset > src/alt
    let mobileSrc = ''
    let desktopSrc = ''
    let assetAlt = ''

    if (asset) {
        // Se asset è un array, prendi il primo elemento
        let normalizedAsset: StoryblokAsset | StoryblokAssetWithBreakpoints | null = null

        if (Array.isArray(asset)) {
            // Array di assets: usa il primo elemento
            normalizedAsset = asset.length > 0 ? asset[0] : null
        } else {
            normalizedAsset = asset
        }

        if (!normalizedAsset) {
            // Array vuoto o null
            const assetSrc = src || ''
            mobileSrc = assetSrc
            desktopSrc = assetSrc
            assetAlt = alt || ''
        } else {
            // Verifica se asset ha mobile/desktop (componente Storyblok)
            const hasBreakpoints = 'mobile' in normalizedAsset || 'desktop' in normalizedAsset

            if (hasBreakpoints) {
                // Asset con breakpoints mobile/desktop
                const assetWithBreakpoints = normalizedAsset as StoryblokAssetWithBreakpoints
                const mobile = assetWithBreakpoints.mobile?.filename
                const desktop = assetWithBreakpoints.desktop?.filename

                if (mobile && desktop) {
                    // Entrambi compilati: usa immagini diverse per breakpoint
                    mobileSrc = mobile
                    desktopSrc = desktop
                } else if (mobile) {
                    // Solo mobile: usa lo stesso per entrambi
                    mobileSrc = mobile
                    desktopSrc = mobile
                } else if (desktop) {
                    // Solo desktop: usa lo stesso per entrambi
                    mobileSrc = desktop
                    desktopSrc = desktop
                }

                assetAlt = assetWithBreakpoints.mobile?.alt || assetWithBreakpoints.desktop?.alt || ''
            } else {
                // Asset diretto (retrocompatibilità)
                const directAsset = normalizedAsset as StoryblokAsset
                const assetSrc = directAsset.filename || ''
                mobileSrc = assetSrc
                desktopSrc = assetSrc
                assetAlt = directAsset.alt || ''
            }
        }
    } else {
        // Modalità retrocompatibilità con src/alt
        const assetSrc = src || ''
        mobileSrc = assetSrc
        desktopSrc = assetSrc
        assetAlt = alt || ''
    }

    // Determina quale src usare in base al viewport
    const currentSrc = isDesktop ? desktopSrc : mobileSrc

    // Se non c'è un src valido, non renderizzare nulla
    if (!currentSrc || currentSrc.trim() === '') {
        return null
    }

    const fileType = useMemo(() => getFileType(currentSrc), [currentSrc])

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
            <div className={cn('asset-video-wrapper', {
                assetHasOverlay: overlay,
                assetModeFit: mode === 'fit'
            }, className)} data-asset>
                <video

                    ref={videoRef}
                    src={currentSrc}
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

    // Se è un'immagine, applica la logica del suffix e gestisci mobile/desktop
    if (fileType === 'image') {
        const dimensions = sizeMap[size]
        const mobileSuffix = dimensions.untilLg
        const desktopSuffix = dimensions.fromLg

        // Se abbiamo mobile e desktop diversi, renderizza entrambe le immagini
        // Verifica se asset ha mobile e desktop diversi
        // Normalizza asset (gestisce array)
        const normalizedAssetForBreakpoints = Array.isArray(asset)
            ? (asset.length > 0 ? asset[0] : null)
            : asset
        const hasBreakpoints = normalizedAssetForBreakpoints && !Array.isArray(normalizedAssetForBreakpoints) && ('mobile' in normalizedAssetForBreakpoints || 'desktop' in normalizedAssetForBreakpoints)
        const assetWithBreakpoints = hasBreakpoints ? normalizedAssetForBreakpoints as StoryblokAssetWithBreakpoints : null
        const hasDifferentAssets = assetWithBreakpoints?.mobile && assetWithBreakpoints?.desktop && mobileSrc !== desktopSrc

        if (hasDifferentAssets) {
            // Renderizza entrambe le immagini, CSS le mostrerà/nasconderà in base al breakpoint
            // Verifica che entrambi gli src siano validi
            if (!mobileSrc || !desktopSrc || mobileSrc.trim() === '' || desktopSrc.trim() === '') {
                return null
            }

            const mobileTransformed = `${mobileSrc}/m/${mobileSuffix}x0`
            const desktopTransformed = `${desktopSrc}/m/${desktopSuffix}x0`

            return (
                <div className={cn('asset-image-wrapper', {
                    assetHasOverlay: overlay,
                    assetModeFit: mode === 'fit'
                }, className)} data-asset>
                    <NextImage
                        src={mobileTransformed}
                        alt={assetAlt}
                        className={cn('asset', 'asset-image', 'asset-image-mobile')}
                        fill
                        objectFit='cover'
                        quality={100}
                        {...rest}
                    />
                    <NextImage
                        src={desktopTransformed}
                        alt={assetAlt}
                        className={cn('asset', 'asset-image', 'asset-image-desktop')}
                        fill
                        objectFit='cover'
                        quality={100}
                        {...rest}
                    />
                </div>
            )
        } else {
            // Usa la stessa immagine per entrambi i breakpoint
            const suffix = isDesktop ? desktopSuffix : mobileSuffix
            const transformedSrc = `${currentSrc}/m/${suffix}x0`

            return (
                <div className={cn('asset-image-wrapper', {
                    assetHasOverlay: overlay,
                    assetModeFit: mode === 'fit'
                }, className)} data-asset>
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
    }

    // Fallback per tipo sconosciuto (renderizza come immagine senza trasformazioni)
    return (
        <div className={cn('asset-image-wrapper', {
            assetHasOverlay: overlay,
            assetModeFit: mode === 'fit'
        }, className)} data-asset>
            <NextImage
                src={currentSrc}
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

/**
 * Estrae l'URL del filename da un asset Storyblok flessibile.
 *
 * Gestisce:
 * - Asset diretto: `{ filename: "..." }`
 * - Array di assets: `[{ filename: "..." }, ...]` – usa il primo elemento
 * - Asset con breakpoints: `{ mobile: {...}, desktop: {...} }` – con priorità configurabile
 *
 * @param asset  L'asset Storyblok (qualsiasi formato accettato dal componente Asset)
 * @param preferDesktop  Se `true` (default), preferisce la variante desktop; altrimenti mobile
 * @returns L'URL del filename o `null` se non trovato
 */
export function getAssetSrc(
    asset: StoryblokAsset | StoryblokAsset[] | StoryblokAssetWithBreakpoints | null | undefined,
    preferDesktop = true,
): string | null {
    if (!asset) return null

    // Se è un array, usa il primo elemento
    const normalized: StoryblokAsset | StoryblokAssetWithBreakpoints | null = Array.isArray(asset)
        ? (asset.length > 0 ? asset[0] : null)
        : asset

    if (!normalized) return null

    // Verifica se ha breakpoints mobile/desktop
    const hasBreakpoints = 'mobile' in normalized || 'desktop' in normalized

    if (hasBreakpoints) {
        const bp = normalized as StoryblokAssetWithBreakpoints
        const primary = preferDesktop ? bp.desktop : bp.mobile
        const fallback = preferDesktop ? bp.mobile : bp.desktop

        return primary?.filename || fallback?.filename || null
    }

    // Asset diretto
    return (normalized as StoryblokAsset).filename || null
}

export default Asset

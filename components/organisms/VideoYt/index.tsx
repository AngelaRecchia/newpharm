'use client'

import { useState, useCallback } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import { Video_ytStoryblok } from '@/types/storyblok'
import { useTranslations } from 'next-intl'
import Icon from '@/components/atoms/Icon'

const cn = classNames.bind(styles)

/**
 * Estrae l'ID video da un URL YouTube o restituisce la stringa se è già un ID
 */
function extractVideoId(input: string): string {
    // Se è già un ID puro (11 caratteri alfanumerici + trattino/underscore)
    if (/^[\w-]{11}$/.test(input)) return input

    try {
        const url = new URL(input)

        // youtube.com/watch?v=ID
        if (url.searchParams.has('v')) return url.searchParams.get('v')!

        // youtu.be/ID
        if (url.hostname === 'youtu.be') return url.pathname.slice(1)

        // youtube.com/embed/ID
        const embedMatch = url.pathname.match(/\/embed\/([\w-]+)/)
        if (embedMatch) return embedMatch[1]
    } catch {
        // non è un URL valido — restituisci così com'è
    }

    return input
}

interface VideoYtProps {
    blok?: Video_ytStoryblok
    videoId?: string // Prop diretta per uso standalone
}

/**
 * VideoYt — player YouTube embeddato
 *
 * Mostra una thumbnail con pulsante play.
 * Al click carica l'iframe YouTube (lazy — zero JS di YouTube finché non serve).
 *
 * Accetta come prop `blok` (da Storyblok) o `videoId` diretto.
 */
const VideoYt = ({ blok, videoId: directVideoId }: VideoYtProps) => {
    const t = useTranslations('')
    const rawId = blok?.video_id || directVideoId || ''
    const videoId = extractVideoId(rawId)
    const [playing, setPlaying] = useState(false)

    const handlePlay = useCallback(() => {
        setPlaying(true)
    }, [])

    if (!videoId) return null

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

    return (
        <section
            className={cn('wrapper')}
            {...(blok ? storyblokEditable(blok as any) : {})}
        >
            <div className={cn('container')}>
                {playing ? (
                    <iframe
                        className={cn('iframe')}
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={t('video_player')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                ) : (
                    <button
                        className={cn('thumbnail')}
                        onClick={handlePlay}
                        aria-label={t('play')}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={thumbnailUrl}
                            alt=""
                            className={cn('thumbnail-img')}
                            loading="lazy"
                        />
                        <div className={cn('play-btn')}>
                            <Icon type="play" size="l" weight="normal" />
                        </div>
                    </button>
                )}
            </div>
        </section>
    )
}

export default VideoYt

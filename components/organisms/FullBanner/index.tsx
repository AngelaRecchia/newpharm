'use client'

import { Full_bannerStoryblok } from '@/types/storyblok';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './index.module.scss'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react';
import Asset, { getFileType } from '@/components/atoms/Asset';
import Button from '@/components/atoms/Button';
import { useTranslations } from 'next-intl';

gsap.registerPlugin(ScrollTrigger);

const cn = classNames.bind(styles);

const FullBanner = ({ blok }: { blok?: Full_bannerStoryblok }) => {

    const t = useTranslations();
    const wrapperRef = useRef<HTMLElement>(null);
    const assetRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const handleTogglePlay = useCallback(() => {
        const video = assetRef.current?.querySelector('video') as HTMLVideoElement;
        if (!video) return;
        if (isPlaying) {
            video.pause()
        } else {
            video.play()
        }
        setIsPlaying(!isPlaying)
    }, [isPlaying, assetRef]);

    useEffect(() => {
        if (typeof window === 'undefined' || !wrapperRef.current || !assetRef.current) return;

        let scrollTrigger: ScrollTrigger | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        // Wait for Lenis and ScrollTrigger to be ready
        const initAnimation = () => {
            if (!wrapperRef.current || !assetRef.current) return;

            // Fattore di velocità parallax (.5 = si muove a metà velocità dello scroll)
            const parallaxSpeed = 0.3;
            const wrapperHeight = wrapperRef.current.offsetHeight - (variant === 'padding' ? -64 : 0);
            const parallaxDistance = wrapperHeight * parallaxSpeed;

            // Crea l'animazione parallax
            // L'asset si muove verso l'alto (y negativo) quando scrolli verso il basso
            const target = assetRef.current
            const parallaxAnimation = gsap.fromTo(target, { y: 0 }, { y: parallaxDistance });

            // Crea ScrollTrigger per l'effetto parallax
            scrollTrigger = ScrollTrigger.create({
                trigger: wrapperRef.current,
                start: 'top top',
                end: 'bottom top',
                animation: parallaxAnimation,
                scrub: true,
            });

            // Refresh ScrollTrigger per assicurarsi che funzioni correttamente
            ScrollTrigger.refresh();
        };

        initAnimation();

        // Cleanup
        return () => {

            if (scrollTrigger) {
                scrollTrigger.kill();
            }
        };
    }, []);

    if (!blok) return <></>;

    const { title, asset, variant } = blok;
    return (
        <section
            ref={wrapperRef}
            className={cn('wrapper', variant)}
            {...storyblokEditable(blok as any)}
        >
            <div className={cn('container')}>
                <div className={cn('content')}>
                    <h2 className={cn('title')}>{title}</h2>
                </div>

                {asset && (
                    <div
                        ref={assetRef}
                        className={cn('asset-wrapper')}
                    >
                        <Asset asset={asset} size="l" overlay hideControls />


                    </div>
                )}
            </div>

            {asset && asset.filename.length > 0 && getFileType(asset.filename) === 'video' && (
                <div className={cn('asset-video-control-wrapper')}>  <Button

                    onClick={handleTogglePlay}
                    className={cn('asset-video-control')}
                    aria-label={isPlaying ? t('pause') : t('play')}
                    icon={isPlaying ? 'pause' : 'play'}
                    variant='tertiary'
                />
                </div>
            )}
        </section>
    )
}

export default FullBanner
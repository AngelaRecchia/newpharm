'use client'

import { Full_bannerStoryblok } from '@/types/storyblok';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './index.module.scss'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react';
import Asset from '@/components/atoms/Asset';

gsap.registerPlugin(ScrollTrigger);

const cn = classNames.bind(styles);

const FullBanner = ({ blok }: { blok?: Full_bannerStoryblok }) => {

    const wrapperRef = useRef<HTMLElement>(null);
    const assetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !wrapperRef.current || !assetRef.current) return;

        let scrollTrigger: ScrollTrigger | null = null;

        // Wait for Lenis and ScrollTrigger to be ready
        const initAnimation = () => {
            if (!wrapperRef.current || !assetRef.current) return;

            const { variant } = blok || {};

            // Fattore di velocità parallax (.5 = si muove a metà velocità dello scroll)
            const parallaxSpeed = 0.3;
            const wrapperHeight = wrapperRef.current.offsetHeight - (variant === 'padding' ? -64 : 0);
            const parallaxDistance = wrapperHeight * parallaxSpeed;

            // Crea l'animazione parallax
            // top bottom: y = -parallaxDistance
            // top top: y = 0 (progress = 0.5 perché modulo = 100vh)
            // bottom top: y = +parallaxDistance
            const target = assetRef.current.querySelector('video') || assetRef.current.querySelector('img');

            // Timeline con keyframes: progress 0 = -n, 0.5 = 0, 1 = +n
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: wrapperRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                }
            });

            // Primo tween: da -n a 0 (progress 0 → 0.5)
            tl.fromTo(target,
                { y: -parallaxDistance },
                { y: 0, duration: 0.5, ease: 'none' }
            );

            // Secondo tween: da 0 a +n (progress 0.5 → 1)
            tl.to(target,
                { y: parallaxDistance, duration: 0.5, ease: 'none' }
            );

            scrollTrigger = tl.scrollTrigger || null;

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
    }, [blok]);

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
                        <Asset
                            asset={asset}
                            size="l"
                            overlay
                            hideControls={false}
                        />
                    </div>
                )}
            </div>
        </section>
    )
}

export default FullBanner
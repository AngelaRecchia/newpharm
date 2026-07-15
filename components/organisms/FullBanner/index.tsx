'use client'

import { Full_bannerStoryblok } from '@/types/storyblok';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './index.module.scss'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react';
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor';
import Asset from '@/components/atoms/Asset';
import RichText from '@/components/organisms/RichText';
import { hasRichTextContent } from '@/lib/api/utils/richtext';

gsap.registerPlugin(ScrollTrigger);

const cn = classNames.bind(styles);

const FullBanner = ({ blok }: { blok?: Full_bannerStoryblok }) => {

    const wrapperRef = useRef<HTMLElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const assetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !wrapperRef.current || !assetRef.current) return;

        let scrollTrigger: ScrollTrigger | null = null;

        const initAnimation = () => {
            if (!wrapperRef.current || !assetRef.current) return;

            const { variant } = blok || {};
            const isPaddingVariant = variant === 'padding';
            const scrollTriggerEl = isPaddingVariant && containerRef.current
                ? containerRef.current
                : wrapperRef.current;

            requestAnimationFrame(() => {
                if (!wrapperRef.current || !assetRef.current || !scrollTriggerEl) return;

                const parallaxSpeed = 0.3;
                const parallaxHeight = scrollTriggerEl.offsetHeight;
                const parallaxDistance = parallaxHeight * parallaxSpeed;

                assetRef.current.style.setProperty('--parallax-shift', `${parallaxDistance}px`);

                const target = assetRef.current.firstElementChild as HTMLElement | null;

                if (!target) return;

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: scrollTriggerEl,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                        invalidateOnRefresh: true,
                    }
                });

                // Primo tween: da -n a 0 (progress 0 → 0.5)
                tl.fromTo(target,
                    { y: -parallaxDistance, force3D: true }, // force3D usa GPU acceleration
                    { y: 0, duration: 0.5, ease: 'none', force3D: true }
                );

                // Secondo tween: da 0 a +n (progress 0.5 → 1)
                tl.to(target,
                    { y: parallaxDistance, duration: 0.5, ease: 'none', force3D: true }
                );

                scrollTrigger = tl.scrollTrigger || null;
            });
        };

        // Aspetta che il layout sia completo prima di inizializzare
        if (document.readyState === 'complete') {
            initAnimation();
        } else {
            window.addEventListener('load', initAnimation, { once: true });
        }

        // Cleanup
        return () => {
            assetRef.current?.style.removeProperty('--parallax-shift');
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
            id={getStoryblokAnchorId(blok.anchor_id)}
            {...storyblokEditable(blok as any)}
        >
            <div ref={containerRef} className={cn('container')}>
                <div className={cn('content')}>
                    {hasRichTextContent(title) && (
                        <RichText content={title} raw className={cn('title')} />
                    )}
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
                            priority
                        />
                    </div>
                )}
            </div>
        </section>
    )
}

export default FullBanner
'use client'

import { RefObject, useContext, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SmoothScrollContext } from '@/lib/context/smooth-scroll-context'

gsap.registerPlugin(ScrollTrigger)

type StickyParallaxOptions = {
    enabled?: boolean
    /** Quota dell'altezza del media usata come corsa del parallasse */
    speed?: number
}

/**
 * Parallasse leggero su un media reso fermo da `position: sticky`.
 * Il media viene traslato entro `--parallax-shift`, che ne compensa l'altezza extra in CSS.
 */
export function useStickyParallax(
    triggerRef: RefObject<HTMLElement | null>,
    mediaRef: RefObject<HTMLElement | null>,
    deps: unknown[] = [],
    { enabled = true, speed = 0.08 }: StickyParallaxOptions = {},
) {
    const { lenis } = useContext(SmoothScrollContext)

    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || !lenis) return

        const trigger = triggerRef.current
        const media = mediaRef.current
        if (!trigger || !media) return

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const getShift = () => media.offsetHeight * speed

        const applyShift = () => {
            media.style.setProperty('--parallax-shift', `${getShift()}px`)
        }

        const gsapContext = gsap.context(() => {
            const targets = media.querySelectorAll('[data-asset]')
            if (targets.length === 0) return

            applyShift()

            gsap.fromTo(
                targets,
                { y: 0, force3D: true },
                {
                    y: () => -getShift(),
                    ease: 'none',
                    force3D: true,
                    scrollTrigger: {
                        trigger,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true,
                        invalidateOnRefresh: true,
                        onRefresh: applyShift,
                    },
                },
            )
        }, triggerRef)

        return () => {
            media.style.removeProperty('--parallax-shift')
            gsapContext.revert()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, lenis, speed, ...deps])
}

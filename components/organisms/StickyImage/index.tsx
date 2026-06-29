'use client'

import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { Sticky_imageStoryblok } from '@/types/storyblok'
import RichText from '../RichText'
import Asset, { getAssetSrc } from '@/components/atoms/Asset'
import HalftoneOverlay from './HalftoneOverlay'
import { useViewport } from '@/lib/context/viewport-context'
import { SmoothScrollContext } from '@/lib/context/smooth-scroll-context'

gsap.registerPlugin(ScrollTrigger)

const cn = classNames.bind(styles)

const StickyImage = ({ blok }: { blok: Sticky_imageStoryblok }) => {
  const { image, title, content, animated } = blok
  const isAnimated = animated !== false
  const { isDesktop } = useViewport()
  const { lenis } = useContext(SmoothScrollContext)
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [webglSupported, setWebglSupported] = useState(true)
  const halftoneProgressRef = useRef(0)
  const halftoneRenderRef = useRef<(() => void) | null>(null)

  const refreshScroll = useCallback(() => {
    requestAnimationFrame(() => {
      lenis?.resize()
      ScrollTrigger.refresh()
    })
  }, [lenis])

  // Check supporto WebGL (solo se animazione attiva)
  useEffect(() => {
    if (!isAnimated) {
      setWebglSupported(false)
      return
    }

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    setWebglSupported(!!gl)
  }, [isAnimated])

  // Estrai la src dell'immagine per l'overlay canvas (solo desktop + animato)
  useEffect(() => {
    if (!isAnimated || !image || typeof window === 'undefined' || !isDesktop) {
      setImageSrc(null)
      return
    }

    setImageSrc(getAssetSrc(image, true))
  }, [image, isDesktop, isAnimated])

  // Sincronizza Lenis/ScrollTrigger dopo il settle iniziale del layout (immagini, font)
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let debounceId: ReturnType<typeof setTimeout> | null = null
    const scheduleRefresh = () => {
      if (debounceId) clearTimeout(debounceId)
      debounceId = setTimeout(refreshScroll, 150)
    }

    const images = section.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', scheduleRefresh, { once: true })
      }
    })

    document.fonts.ready.then(scheduleRefresh)
    scheduleRefresh()

    return () => {
      if (debounceId) clearTimeout(debounceId)
      images.forEach((img) => img.removeEventListener('load', scheduleRefresh))
    }
  }, [refreshScroll])

  // Su resize finestra aggiorna solo Lenis — ScrollTrigger.refresh() qui duplicava i nested blok
  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      if (debounceId) clearTimeout(debounceId)
      debounceId = setTimeout(() => lenis?.resize(), 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (debounceId) clearTimeout(debounceId)
      window.removeEventListener('resize', handleResize)
    }
  }, [lenis])

  // ScrollTrigger – progress halftone legato allo scroll
  useEffect(() => {
    if (!isAnimated || !isDesktop || !leftRef.current || !rightRef.current) return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    if (!mediaQuery.matches) return

    const right = rightRef.current

    const scrollTrigger = ScrollTrigger.create({
      trigger: right,
      scroller: document.body,
      start: 'top top',
      end: 'bottom center',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        halftoneProgressRef.current = self.progress
        halftoneRenderRef.current?.()
      },
    })

    refreshScroll()

    return () => {
      scrollTrigger.kill()
    }
  }, [isDesktop, isAnimated, refreshScroll])

  return (
    <section ref={sectionRef} className={cn('wrapper', { 'no-webgl': !isAnimated || !webglSupported })}>
      <div className={cn('title')}>
        <h2 >{title}</h2>
      </div>

      <div className={cn('content')}>
        <div ref={leftRef} className={cn('left')}>
          <div className={cn('image-wrapper')}>
            <Asset asset={image} mode='fit' priority={true} />
          </div>

          {isAnimated && isDesktop && imageSrc && webglSupported && (
            <div className={cn('halftone-overlay-wrapper')}>
              <HalftoneOverlay
                imageSrc={imageSrc}
                columns={60}
                mode='scroll'
                progressRef={halftoneProgressRef}
                renderRef={halftoneRenderRef}
              />
            </div>
          )}
        </div>

        <div ref={rightRef} className={cn('right')}>
          <RichText content={content} raw className={cn('rt-wrapper')} />
        </div>
      </div>
    </section>
  )
}

export default StickyImage

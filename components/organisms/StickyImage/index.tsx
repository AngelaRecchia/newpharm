'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { Sticky_imageStoryblok } from '@/types/storyblok'
import RichText from '../RichText'
import Asset, { getAssetSrc } from '@/components/atoms/Asset'
import HalftoneOverlay from './HalftoneOverlay'
import { useViewport } from '@/lib/context/viewport-context'

gsap.registerPlugin(ScrollTrigger)

const cn = classNames.bind(styles)

const StickyImage = ({ blok }: { blok: Sticky_imageStoryblok }) => {
  const { image, title, content } = blok
  const { isDesktop } = useViewport()
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [webglSupported, setWebglSupported] = useState(true)
  const halftoneProgressRef = useRef(0)

  // Check supporto WebGL
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    setWebglSupported(!!gl)
  }, [])

  // Estrai la src dell'immagine (solo su desktop)
  useEffect(() => {
    if (!image || typeof window === 'undefined' || !isDesktop) {
      setImageSrc(null)
      return
    }

    setImageSrc(getAssetSrc(image, true))
  }, [image, isDesktop])

  // ScrollTrigger – progress halftone legato allo scroll
  useEffect(() => {
    if (!isDesktop || !leftRef.current || !rightRef.current) return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    if (!mediaQuery.matches) return

    const right = rightRef.current

    const scrollTrigger = ScrollTrigger.create({
      trigger: right,
      start: 'top top',
      end: 'bottom center',
      scrub: true,
      onUpdate: (self) => { halftoneProgressRef.current = self.progress },
    })

    const handleResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', handleResize)

    return () => {
      scrollTrigger.kill()
      window.removeEventListener('resize', handleResize)
    }
  }, [isDesktop])

  return (
    <section className={cn('wrapper', { 'no-webgl': !webglSupported })}>
      <div className={cn('title')}>
        <h2 >{title}</h2>
      </div>

      <div className={cn('content')}>
        <div ref={leftRef} className={cn('left')}>
          <div className={cn('image-wrapper')}>
            <Asset asset={image} mode='fit' />
          </div>

          {isDesktop && imageSrc && webglSupported && (
            <div className={cn('halftone-overlay-wrapper')}>
              <HalftoneOverlay
                imageSrc={imageSrc}
                columns={60}
                mode='scroll'
                progressRef={halftoneProgressRef}
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

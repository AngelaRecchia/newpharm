'use client'

import React, { useEffect, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { Banner_accordionStoryblok, Card_boxStoryblok } from '@/types/storyblok'
import Asset from '@/components/atoms/Asset'
import CardBox from '@/components/molecules/CardBox'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BREAKPOINT_MD_PX } from '@/lib/breakpoints'
import { useViewport } from '@/lib/context/viewport-context'

gsap.registerPlugin(ScrollTrigger)

const cn = classNames.bind(styles)

const Banneraccordion = ({ blok }: { blok?: Banner_accordionStoryblok }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const { isDesktop } = useViewport()

  const { image, items } = blok || {}

  // Gestisci quale card è aperta (accordion behavior)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Inizializza: a desktop prima card aperta, mobile tutte chiuse
  useEffect(() => {
    if (isDesktop && items && items.length > 0) {
      setOpenIndex(0)
    } else {
      setOpenIndex(null)
    }
  }, [isDesktop, items])

  const handleCardToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !wrapperRef.current || !contentRef.current || !items || items.length === 0) return

    const wrapper = wrapperRef.current
    const content = contentRef.current
    const cards = content.children

    if (cards.length === 0) return

    // Calcola la larghezza totale delle card e il gap
    const calculateDimensions = () => {
      let totalWidth = 0
      Array.from(cards).forEach((card) => {
        totalWidth += (card as HTMLElement).offsetWidth
      })
      const gap = 16 // $s-16
      const totalContentWidth = totalWidth + (gap * (cards.length - 1))
      const viewportWidth = window.innerWidth

      // Calcola il padding effettivo dal container-lg: $s-24 (24px) mobile, $s-40 (40px) desktop
      const isMobile = viewportWidth < BREAKPOINT_MD_PX
      const paddingPx = isMobile ? 24 : 40 // $s-24 = 24px, $s-40 = 40px
      const totalPadding = paddingPx * 2 // padding su entrambi i lati

      // Lo spazio disponibile è la viewport meno il padding
      const availableWidth = viewportWidth - totalPadding
      const scrollDistance = totalContentWidth - availableWidth

      return { totalContentWidth, scrollDistance, viewportWidth, availableWidth }
    }

    // Calcola se tutte le card sono già in viewport
    const checkIfAllCardsInViewport = () => {
      const { scrollDistance } = calculateDimensions()
      return scrollDistance <= 0
    }

    // Crea l'animazione delle card da destra a sinistra
    const initAnimation = () => {
      // Ricalcola le dimensioni ogni volta
      const { scrollDistance } = calculateDimensions()

      // Se tutte le card sono già visibili, non fare nulla
      if (scrollDistance <= 0) {
        if (scrollTriggerRef.current) {
          scrollTriggerRef.current.kill()
          scrollTriggerRef.current = null
        }
        gsap.set(content, { x: 0 })
        return
      }

      // Kill previous ScrollTrigger if exists
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill()
      }

      // Imposta la posizione iniziale delle card (fuori dalla viewport a destra)
      gsap.set(content, { x: 0, force3D: true })

      // Crea la timeline per animare le card
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: () => `+=${scrollDistance}px`,
          pin: true,
          pinSpacing: true,
          scrub: 1, // Valore più basso = più smooth, più alto = più responsive
          invalidateOnRefresh: true,

        }
      })

      // Anima il contenuto da destra (0) a sinistra (-scrollDistance)
      tl.to(content, {
        x: -scrollDistance,
        ease: 'none',
        duration: 1,
        force3D: true, // Forza accelerazione hardware
        roundProps: 'x', // Arrotonda i valori per evitare sub-pixel rendering
      })

      scrollTriggerRef.current = tl.scrollTrigger || null
    }

    // Se tutte le card sono già visibili all'inizio, non fare nulla
    if (checkIfAllCardsInViewport()) {
      return
    }

    initAnimation()

    // Gestisci il resize
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        initAnimation()
        ScrollTrigger.refresh()
      }, 250)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill()
      }
    }
  }, [items])

  return (
    <div ref={wrapperRef} className={cn('wrapper')}>
      <div className={cn('container')}>
        <div className={cn('image')}>
          <Asset asset={image} size='l' overlay />
        </div>

        <div ref={contentRef} className={cn('content')}>
          {items?.map((item, index) => (
            <CardBox
              key={item._uid}
              blok={item as Card_boxStoryblok}
              isOpen={openIndex === index}
              onToggle={() => handleCardToggle(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Banneraccordion

'use client'

import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// Configurazione globale per ridurre forced reflows
if (typeof window !== 'undefined') {
  // Configura ScrollTrigger per batchare gli aggiornamenti
  ScrollTrigger.config({
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
    ignoreMobileResize: true, // Ignora resize su mobile per migliorare performance
  })
  
  // Configura GSAP per usare GPU acceleration quando possibile
  gsap.config({
    force3D: 'auto', // Usa GPU acceleration automaticamente
  })
}

interface SmoothScrollContextType {
  lenis: Lenis | null
}

export const SmoothScrollContext = React.createContext<SmoothScrollContextType>({
  lenis: null,
})

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize Lenis
    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    })

    lenisRef.current = lenisInstance
    setLenis(lenisInstance)

    // Cache delle dimensioni della viewport per evitare forced reflows
    let cachedViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Aggiorna il cache solo quando necessario (resize)
    const updateViewportCache = () => {
      cachedViewport.width = window.innerWidth
      cachedViewport.height = window.innerHeight
    }

    window.addEventListener('resize', updateViewportCache, { passive: true })

    // Setup ScrollTrigger scroller proxy for Lenis
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: number) {
        if (arguments.length && value !== undefined) {
          lenisInstance.scrollTo(value, { immediate: true })
        }
        return lenisInstance.scroll
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: cachedViewport.width,
          height: cachedViewport.height,
        }
      },
    })

    // Update ScrollTrigger on Lenis scroll
    lenisInstance.on('scroll', ScrollTrigger.update)

    // Set ScrollTrigger default scroller
    ScrollTrigger.defaults({ scroller: document.body })

    // Lenis animation frame con cancellazione corretta
    function raf(time: number) {
      lenisInstance.raf(time)
      rafIdRef.current = requestAnimationFrame(raf)
    }

    rafIdRef.current = requestAnimationFrame(raf)

    // Cleanup
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      window.removeEventListener('resize', updateViewportCache)
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      lenisInstance.destroy()
      lenisRef.current = null
      setLenis(null)
    }
  }, [])

  return (
    <SmoothScrollContext.Provider value={{ lenis }}>
      {children}
    </SmoothScrollContext.Provider>
  )
}

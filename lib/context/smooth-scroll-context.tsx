'use client'

import React, { ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
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

let scrollLockCount = 0
let savedScrollY = 0

function applyNativeScrollLock(scrollY: number) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.scrollLock = 'true'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
}

function releaseNativeScrollLock() {
  if (typeof document === 'undefined') return

  delete document.documentElement.dataset.scrollLock
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
}

function lockPageScroll(lenis: Lenis | null) {
  if (scrollLockCount === 0) {
    savedScrollY = lenis?.scroll ?? window.scrollY
    applyNativeScrollLock(savedScrollY)
    lenis?.stop()
  }
  scrollLockCount += 1
}

function unlockPageScroll(lenis: Lenis | null) {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    const scrollY = savedScrollY
    releaseNativeScrollLock()
    lenis?.start()
    if (lenis) {
      lenis.scrollTo(scrollY, { immediate: true })
    } else {
      window.scrollTo(0, scrollY)
    }
  }
}

/**
 * Blocca lo scroll della pagina tramite Lenis + overflow nativo (contatore per overlay multipli).
 * Per aree scrollabili interne (menu mobile, modale) usare `data-lenis-prevent`.
 */
export function useScrollLock(locked: boolean) {
  const { lenis } = useContext(SmoothScrollContext)

  useEffect(() => {
    if (!locked) return

    lockPageScroll(lenis)

    return () => {
      unlockPageScroll(lenis)
    }
  }, [locked, lenis])
}

/** Ricalcola altezza scroll Lenis e posizioni ScrollTrigger dopo cambi layout (es. load more) */
export function refreshPageScroll(lenis: Lenis | null) {
  requestAnimationFrame(() => {
    lenis?.resize()
    ScrollTrigger.refresh()
    const viewportHeight = document.documentElement.clientHeight
    const limit =
      lenis?.limit ?? Math.max(0, document.documentElement.scrollHeight - viewportHeight)
    const current = lenis?.scroll ?? window.scrollY
    if (current > limit) {
      if (lenis) {
        lenis.scrollTo(limit, { immediate: true })
      } else {
        window.scrollTo(0, limit)
      }
    }
  })
}

/** True se il resize è solo la chrome mobile (stessa larghezza). */
export function isViewportWidthUnchanged(previousWidth: number) {
  return window.innerWidth === previousWidth
}

export function useRefreshPageScroll() {
  const { lenis } = useContext(SmoothScrollContext)
  return useCallback(() => refreshPageScroll(lenis), [lenis])
}

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
      prevent: (node) =>
        node instanceof Element && node.closest('[data-lenis-prevent]') !== null,
    })

    lenisRef.current = lenisInstance
    setLenis(lenisInstance)

    if (scrollLockCount > 0) {
      savedScrollY = lenisInstance.scroll
      applyNativeScrollLock(savedScrollY)
      lenisInstance.stop()
    }

    // Cache delle dimensioni della viewport per evitare forced reflows
    let cachedViewport = {
      width: window.innerWidth,
      height: document.documentElement.clientHeight,
    }

    const updateViewportCache = () => {
      const width = window.innerWidth
      if (width === cachedViewport.width) return
      cachedViewport.width = width
      cachedViewport.height = document.documentElement.clientHeight
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
      if (scrollLockCount > 0) {
        releaseNativeScrollLock()
        lenisInstance.start()
        lenisInstance.scrollTo(savedScrollY, { immediate: true })
        scrollLockCount = 0
      }
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

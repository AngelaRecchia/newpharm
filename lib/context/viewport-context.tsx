'use client'

import { createContext, useContext, useState, useLayoutEffect, ReactNode } from 'react'
import { BREAKPOINT_MD_PX, BREAKPOINT_LG_PX } from '../breakpoints'

interface ViewportContextType {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  untilMd: boolean
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined)

const QUERY_MD_UP = `(min-width: ${BREAKPOINT_MD_PX}px)`
const QUERY_LG_UP = `(min-width: ${BREAKPOINT_LG_PX}px)`

function getViewportFromMedia(mdMatches: boolean, lgMatches: boolean, width = 0, height = 0): ViewportContextType {
  return {
    width,
    height,
    isMobile: !mdMatches,
    isTablet: mdMatches && !lgMatches,
    isDesktop: lgMatches,
    untilMd: !mdMatches,

  }
}

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ViewportContextType>(() =>
    // Default viewport is desktop
    getViewportFromMedia(true, true, 1024, 768)
  )

  useLayoutEffect(() => {
    const md = window.matchMedia(QUERY_MD_UP)
    const lg = window.matchMedia(QUERY_LG_UP)

    const update = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setViewport(getViewportFromMedia(md.matches, lg.matches, width, height))
    }

    update()

    md.addEventListener('change', update)
    lg.addEventListener('change', update)
    return () => {
      md.removeEventListener('change', update)
      lg.removeEventListener('change', update)
    }
  }, [])

  return (
    <ViewportContext.Provider value={viewport}>
      {children}
    </ViewportContext.Provider>
  )
}

/**
 * Hook per accedere alle informazioni della viewport.
 * Breakpoints derivano da matchMedia; lo state si aggiorna solo al cambio di breakpoint, non a ogni resize.
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, untilMd, width } = useViewport()
 * ```
 */
export function useViewport() {
  const context = useContext(ViewportContext)

  if (context === undefined) {
    throw new Error('useViewport must be used within a ViewportProvider')
  }

  return context
}

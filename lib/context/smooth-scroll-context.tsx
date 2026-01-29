'use client'

'use client'

import React, { ReactNode, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scrollbar from 'smooth-scrollbar'

gsap.registerPlugin(ScrollTrigger)

interface SmoothScrollContextType {
  scrollbar: Scrollbar | null
}

export const SmoothScrollContext = React.createContext<SmoothScrollContextType>({
  scrollbar: null,
})

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const scrollbarRef = useRef<Scrollbar | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current) return

    const scroller = document.querySelector('.scroller') as HTMLElement
    if (!scroller) return

    // Initialize smooth scrollbar
    const bodyScrollBar = Scrollbar.init(scroller, {
      damping: 0.1,
      delegateTo: document,
      alwaysShowTracks: true,
    })

    scrollbarRef.current = bodyScrollBar
    initializedRef.current = true

    // Setup ScrollTrigger scroller proxy
    ScrollTrigger.scrollerProxy('.scroller', {
      scrollTop(value?: number) {
        if (arguments.length && value !== undefined) {
          bodyScrollBar.scrollTop = value
        }
        return bodyScrollBar.scrollTop
      },
    })

    bodyScrollBar.addListener(ScrollTrigger.update)

    ScrollTrigger.defaults({ scroller: scroller })

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      bodyScrollBar.destroy()
      scrollbarRef.current = null
      initializedRef.current = false
    }
  }, [])

  return (
    <SmoothScrollContext.Provider value={{ scrollbar: scrollbarRef.current }}>
      {children}
    </SmoothScrollContext.Provider>
  )
}

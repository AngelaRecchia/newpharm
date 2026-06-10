'use client'

import { useEffect } from 'react'

let lockCount = 0
/** Scroll salvato al primo lock (px) — ripristinato all’ultimo unlock */
let lockedScrollY = 0

let savedHtmlOverflow = ''
let savedBody: {
  overflow: string
  position: string
  top: string
  left: string
  right: string
  width: string
} = {
  overflow: '',
  position: '',
  top: '',
  left: '',
  right: '',
  width: '',
}

/**
 * Blocca lo scroll senza saltare la pagina in cima: `overflow` da solo spesso resetta lo scroll.
 * Al primo lock: `position: fixed` + `top: -scrollY` sul body; all’ultimo unlock: ripristino + `scrollTo`.
 *
 * Contatore: più overlay (modale + header) non si pestano i piedi.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    if (lockCount === 0) {
      lockedScrollY = window.scrollY
      const html = document.documentElement
      const body = document.body

      savedHtmlOverflow = html.style.overflow
      savedBody = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
      }

      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
      body.style.top = `-${lockedScrollY}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount !== 0) return

      const html = document.documentElement
      const body = document.body
      const y = lockedScrollY

      html.style.overflow = savedHtmlOverflow
      body.style.overflow = savedBody.overflow
      body.style.position = savedBody.position
      body.style.top = savedBody.top
      body.style.left = savedBody.left
      body.style.right = savedBody.right
      body.style.width = savedBody.width

      window.scrollTo(0, y)
    }
  }, [locked])
}

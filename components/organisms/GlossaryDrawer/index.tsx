'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames/bind'
import { useLocale, useTranslations } from 'next-intl'
import Icon from '@/components/atoms/Icon'
import RichText from '@/components/organisms/RichText'
import { BREAKPOINT_LG_PX } from '@/lib/breakpoints'
import { useViewport } from '@/lib/context/viewport-context'
import { groupGlossaryByLetter } from '@/lib/glossary/group'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import type { GlossaryItem } from '@/lib/glossary/types'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const SHEET_PEEK = 0.3
const DRAG_TAP_PX = 8
const EXPAND_PX = 40
const CLOSE_PX = 80

type GlossaryDrawerProps = {
  items: GlossaryItem[]
  open: boolean
  activeUid: string | null
  onClose: () => void
}

type DragSession = {
  pointerId: number
  startY: number
  startTranslate: number
  lastY: number
  lastTime: number
  currentY: number
  velocity: number
}

const GlossaryAccordionRow = ({
  item,
  expanded,
  onToggle,
  rowRef,
}: {
  item: GlossaryItem
  expanded: boolean
  onToggle: () => void
  rowRef?: (node: HTMLDivElement | null) => void
}) => {
  const panelId = `glossary-def-${item.uid}`
  const headerId = `glossary-term-${item.uid}`

  return (
    <div
      ref={rowRef}
      className={cn('row', { open: expanded })}
      data-glossary-uid={item.uid}
    >
      <button
        type="button"
        id={headerId}
        className={cn('row-header')}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={cn('row-term')}>{item.term}</span>
        <span className={cn('row-toggle')} aria-hidden="true">
          <Icon type="more" size="m" />
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={cn('row-body')}
        inert={!expanded ? true : undefined}
      >
        <div className={cn('row-body-inner')}>
          <RichText content={item.definition} raw />
        </div>
      </div>
    </div>
  )
}

const GlossaryDrawer = ({
  items,
  open,
  activeUid,
  onClose,
}: GlossaryDrawerProps) => {
  const t = useTranslations('')
  const locale = useLocale()
  const { isDesktop } = useViewport()
  const isSheet = !isDesktop
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const dragRef = useRef<DragSession | null>(null)
  const ignoreScrollExpand = useRef(true)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set())
  const titleId = 'glossary-drawer-title'
  const groups = groupGlossaryByLetter(items, locale)

  const peekY = useCallback(
    () => (typeof window === 'undefined' ? 0 : window.innerHeight * SHEET_PEEK),
    [],
  )

  const clearDragStyle = useCallback(() => {
    panelRef.current?.style.removeProperty('--sheet-y')
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      ignoreScrollExpand.current = true
      setVisible(true)
      setClosing(false)
      setExpanded(false)
      setDragging(false)
      setEntered(
        reduceMotion ||
          window.matchMedia(`(min-width: ${BREAKPOINT_LG_PX}px)`).matches,
      )
      clearDragStyle()
      return
    }
    if (!visible) return

    const reduceMotionClose = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotionClose) {
      setVisible(false)
      setClosing(false)
      setExpanded(false)
      setEntered(false)
      return
    }
    setClosing(true)
  }, [open, visible, clearDragStyle])

  useBodyScrollLock(visible)

  useEffect(() => {
    if (!open || !activeUid) return
    setExpandedUids(new Set([activeUid]))
  }, [open, activeUid])

  useEffect(() => {
    if (!open) return
    if (!activeUid) {
      ignoreScrollExpand.current = false
      return
    }
    const node = rowRefs.current.get(activeUid)
    let afterScroll = 0
    const timer = window.setTimeout(() => {
      node?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      afterScroll = window.setTimeout(() => {
        ignoreScrollExpand.current = false
      }, 450)
    }, 50)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(afterScroll)
    }
  }, [open, activeUid])

  useEffect(() => {
    if (dragging) return
    clearDragStyle()
  }, [dragging, expanded, closing, clearDragStyle])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      closeRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    panel.addEventListener('keydown', onKeyDown)
    return () => panel.removeEventListener('keydown', onKeyDown)
  }, [open])

  const finishClose = useCallback(() => {
    clearDragStyle()
    setVisible(false)
    setClosing(false)
    setExpanded(false)
    setEntered(false)
    setDragging(false)
  }, [clearDragStyle])

  const expandSheet = useCallback(() => {
    if (!isSheet || closing) return
    setExpanded(true)
  }, [isSheet, closing])

  const toggle = useCallback(
    (uid: string) => {
      expandSheet()
      setExpandedUids((current) => {
        const next = new Set(current)
        if (next.has(uid)) next.delete(uid)
        else next.add(uid)
        return next
      })
    },
    [expandSheet],
  )

  const onBodyScroll = useCallback(() => {
    if (ignoreScrollExpand.current) return
    expandSheet()
  }, [expandSheet])

  const onGrabPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isSheet || closing) return
      if ((event.target as HTMLElement).closest('button')) return

      const startTranslate = expanded ? 0 : peekY()
      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startTranslate,
        lastY: event.clientY,
        lastTime: performance.now(),
        currentY: startTranslate,
        velocity: 0,
      }
      setDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [closing, expanded, isSheet, peekY],
  )

  const onGrabPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return

      const now = performance.now()
      const dt = now - drag.lastTime
      if (dt > 0) {
        drag.velocity = (event.clientY - drag.lastY) / dt
      }
      drag.lastY = event.clientY
      drag.lastTime = now

      const nextY = Math.min(
        window.innerHeight,
        Math.max(0, drag.startTranslate + (event.clientY - drag.startY)),
      )
      drag.currentY = nextY
      panelRef.current?.style.setProperty('--sheet-y', `${nextY}px`)
    },
    [],
  )

  const onGrabPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      dragRef.current = null
      setDragging(false)

      const y = drag.currentY
      const dy = event.clientY - drag.startY
      const peek = peekY()
      const flickedDown = dy > DRAG_TAP_PX && drag.velocity > 0.45
      const flickedUp = dy < -DRAG_TAP_PX && drag.velocity < -0.35

      if (Math.abs(dy) < DRAG_TAP_PX && !flickedDown && !flickedUp) {
        expandSheet()
        return
      }

      if (expanded) {
        if (y > peek + CLOSE_PX || (y > peek && flickedDown)) {
          onClose()
          return
        }
        if (y > EXPAND_PX || flickedDown) {
          setExpanded(false)
          return
        }
        setExpanded(true)
        return
      }

      if (y > peek + CLOSE_PX || flickedDown) {
        onClose()
        return
      }
      if (y < peek - EXPAND_PX || flickedUp) {
        setExpanded(true)
      }
    },
    [expandSheet, expanded, onClose, peekY],
  )

  if (!mounted || !visible) return null

  return createPortal(
    <div
      className={cn('backdrop', { closing })}
      role="presentation"
      data-lenis-prevent
      onClick={(event) => {
        if (closing) return
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className={cn('panel', {
          closing,
          entered,
          expanded: expanded && isSheet,
          dragging,
        })}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-lenis-prevent
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (
            !closing &&
            event.animationName.includes('sheet-in')
          ) {
            setEntered(true)
            return
          }
          if (!closing) return
          if (
            !event.animationName.includes('slide-out') &&
            !event.animationName.includes('sheet-out')
          ) {
            return
          }
          finishClose()
        }}
      >
        <div
          className={cn('grab')}
          onPointerDown={onGrabPointerDown}
          onPointerMove={onGrabPointerMove}
          onPointerUp={onGrabPointerUp}
          onPointerCancel={onGrabPointerUp}
        >
          <div className={cn('handle')} aria-hidden="true" />
          <div className={cn('header')}>
            <h3 id={titleId} className={cn('title')}>
              {t('glossary')}
            </h3>
            <button
              ref={closeRef}
              type="button"
              className={cn('close')}
              onClick={onClose}
              aria-label={t('close')}
            >
              <Icon type="close" size="l" weight="normal" />
            </button>
          </div>
        </div>
        <div className={cn('body')} onScroll={onBodyScroll}>
          {groups.map((group) => (
            <section key={group.letter} className={cn('letter-group')}>
              <h6 className={cn('letter')}>{group.letter}</h6>
              <div className={cn('rows')}>
                {group.items.map((item) => (
                  <GlossaryAccordionRow
                    key={item.uid}
                    item={item}
                    expanded={expandedUids.has(item.uid)}
                    onToggle={() => toggle(item.uid)}
                    rowRef={(node) => {
                      if (node) rowRefs.current.set(item.uid, node)
                      else rowRefs.current.delete(item.uid)
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default GlossaryDrawer

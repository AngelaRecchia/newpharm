'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Icon from '@/components/atoms/Icon'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** id di un elemento nel `children` per aria-labelledby */
  ariaLabelledBy?: string
  /** Se non usi ariaLabelledBy */
  ariaLabel?: string
  hideCloseButton?: boolean
  closeLabel?: string
  /** Classe aggiuntiva sul pannello (es. max-width) */
  panelClassName?: string
  /** Selettore del primo elemento da mettere a fuoco all’apertura (es. `input`) */
  initialFocusSelector?: string | false
  style?: CSSProperties
}

export default function Modal({
  open,
  onClose,
  children,
  ariaLabelledBy,
  ariaLabel,
  hideCloseButton = false,
  closeLabel = 'Chiudi',
  panelClassName,
  initialFocusSelector = false,
  style,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [present, setPresent] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) setPresent(true)
  }, [open])

  useBodyScrollLock(open || present)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || initialFocusSelector === false) return
    const t = window.setTimeout(() => {
      const sel =
        typeof initialFocusSelector === 'string'
          ? initialFocusSelector
          : 'input, select, textarea, button, [href]'
      panelRef.current
        ?.querySelector<HTMLElement>(sel)
        ?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, initialFocusSelector])

  if (!mounted) return null

  const fadeTransition = {
    duration: reduceMotion ? 0.01 : 0.25,
    ease: [0.4, 0, 0.2, 1] as const,
  }

  return createPortal(
    <AnimatePresence onExitComplete={() => setPresent(false)}>
      {open ? (
        <motion.div
          className={cn('backdrop')}
          role="presentation"
          data-lenis-prevent
          style={style}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={panelRef}
            className={cn('panel', panelClassName)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
          >
            {!hideCloseButton && (
              <button
                type="button"
                className={cn('close')}
                onClick={onClose}
                aria-label={closeLabel}
              >
                <Icon type="close" size="l" weight="normal" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

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

  useEffect(() => {
    setMounted(true)
  }, [])

  useBodyScrollLock(open)

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

  if (!mounted || !open) return null

  return createPortal(
    <div
      className={cn('backdrop')}
      role="presentation"
      style={style}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className={cn('panel', panelClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        tabIndex={-1}
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
      </div>
    </div>,
    document.body
  )
}

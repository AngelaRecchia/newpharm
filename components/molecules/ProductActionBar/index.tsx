'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Icon from '@/components/atoms/Icon'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type ProductActionBarVariant = 'download' | 'compare'

export interface ProductActionBarProps {
  open: boolean
  variant: ProductActionBarVariant
  multiLine?: boolean
  onClose: () => void
  closeLabel?: string
  ariaLabel?: string
  children: ReactNode
}

export default function ProductActionBar({
  open,
  variant,
  multiLine = false,
  onClose,
  closeLabel = 'Chiudi',
  ariaLabel,
  children,
}: ProductActionBarProps) {
  const [mounted, setMounted] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key={variant}
          className={cn('bar', variant, { multiLine })}
          role="region"
          aria-label={ariaLabel}
          data-product-action-bar={variant}
          initial={reduceMotion ? false : { y: '100%' }}
          animate={{ y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
          transition={{
            duration: reduceMotion ? 0.01 : 0.35,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <div className={cn('inner')}>{children}</div>
          <button
            type="button"
            className={cn('close')}
            onClick={onClose}
            aria-label={closeLabel}
          >
            <Icon type="close" size="l" weight="normal" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import Icon from '@/components/atoms/Icon'
import styles from './CompareProductSelect.module.scss'

const cn = classNames.bind(styles)

export type CompareSelectOption = {
  value: string
  label: string
}

export interface CompareProductSelectProps {
  value?: string | null
  options: CompareSelectOption[]
  placeholder: string
  onChange: (value: string | null) => void
}

export default function CompareProductSelect({
  value,
  options,
  placeholder,
  onChange,
}: CompareProductSelectProps) {
  const [open, setOpen] = useState(false)
  const [scrollState, setScrollState] = useState({
    canScrollTop: false,
    canScrollBottom: false,
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const selectedOption = options.find((option) => option.value === value)
  const displayLabel = selectedOption?.label ?? placeholder
  const isPlaceholder = !selectedOption

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const { scrollHeight, clientHeight, scrollTop } = el
    const canScroll = scrollHeight > clientHeight + 1

    setScrollState({
      canScrollTop: canScroll && scrollTop > 1,
      canScrollBottom: canScroll && scrollTop + clientHeight < scrollHeight - 1,
    })
  }, [])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return

    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && scrollRef.current?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', updateScrollState)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [open, updateScrollState])

  useEffect(() => {
    if (!open) {
      setScrollState({ canScrollTop: false, canScrollBottom: false })
      return
    }

    const el = scrollRef.current
    if (!el) return

    updateScrollState()
    const frame = requestAnimationFrame(updateScrollState)
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [open, options, updateScrollState])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={cn('root', { open })} ref={rootRef}>
      <button
        type="button"
        className={cn('trigger', { open })}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={cn('label', { placeholder: isPlaceholder })}>{displayLabel}</span>
        <span className={cn('chevronWrap')} aria-hidden>
          <Icon
            type="chevron-down"
            size="sm"
            weight="bold"
            className={cn('chevron', { open })}
          />
        </span>
      </button>

      {open ? (
        <div ref={panelRef} id={listboxId} className={cn('panel')} role="listbox">
          <div className={cn('scrollArea')}>
            <div
              ref={scrollRef}
              className={cn('scroll')}
              data-lenis-prevent
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn('option', { selected: option.value === value })}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {scrollState.canScrollTop ? (
            <div className={cn('fade', 'top')} aria-hidden />
          ) : null}
          {scrollState.canScrollBottom ? (
            <div className={cn('fade', 'bottom')} aria-hidden />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

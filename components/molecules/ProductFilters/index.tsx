'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { animate } from 'motion/react'
import FilterChip from '@/components/atoms/FilterChip'
import {
  type FiltriEntry,
  getBundledFiltriEntries,
  getParsedBundledFiltri,
  getSubfilterLabel,
  getSubfiltersForCategory,
  parseFiltriEntries,
} from '@/lib/filtri'
import styles from './index.module.scss'

const cn = classNames.bind(styles)
const DRAG_THRESHOLD_PX = 4
const MIN_SCROLL_DELTA_PX = 8
const CENTER_TOLERANCE_RATIO = 0.12
const CHIP_SCROLL_SPRING = {
  type: 'spring' as const,
  stiffness: 160,
  damping: 22,
  mass: 0.9,
}

function getCenteredScrollTarget(
  track: HTMLElement,
  chip: HTMLElement,
): number | null {
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  if (maxScroll <= 0) return null

  const chipStart = chip.offsetLeft
  const chipEnd = chipStart + chip.offsetWidth
  const chipCenter = chipStart + chip.offsetWidth / 2
  const viewStart = track.scrollLeft
  const viewEnd = viewStart + track.clientWidth
  const target = Math.max(0, Math.min(maxScroll, chipCenter - track.clientWidth / 2))

  if (Math.abs(track.scrollLeft - target) < MIN_SCROLL_DELTA_PX) {
    return null
  }

  const isFullyVisible = chipStart >= viewStart && chipEnd <= viewEnd
  const chipCenterInView = chipCenter - viewStart
  const centerOffset = Math.abs(chipCenterInView - track.clientWidth / 2)

  if (isFullyVisible && centerOffset <= track.clientWidth * CENTER_TOLERANCE_RATIO) {
    return null
  }

  return target
}

export type ProductFiltersValue = {
  /** `null` = tutte le categorie (select sticky nav) */
  category: string | null
  subcategories: string[]
}

export type ProductFiltersProps = {
  value: ProductFiltersValue
  onChange: (value: ProductFiltersValue) => void
  entries?: FiltriEntry[]
  className?: string
}

function FilterChipRow({
  items,
  selectedValues,
  onToggle,
}: {
  items: { value: string; label: string }[]
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({
    active: false,
    captured: false,
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  })
  const inertiaFrameRef = useRef<number | null>(null)
  const scrollAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const initialScrollDoneRef = useRef(false)
  const [isGrabbing, setIsGrabbing] = useState(false)

  const stopScrollMotion = useCallback(() => {
    scrollAnimationRef.current?.stop()
    scrollAnimationRef.current = null

    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current)
      inertiaFrameRef.current = null
    }
  }, [])

  useEffect(() => () => stopScrollMotion(), [stopScrollMotion])

  const scrollChipIntoView = useCallback((value: string) => {
    const track = trackRef.current
    const inner = innerRef.current
    if (!track || !inner) return

    const index = items.findIndex((item) => item.value === value)
    if (index < 0) return

    const chip = inner.children[index] as HTMLElement | undefined
    if (!chip) return

    const target = getCenteredScrollTarget(track, chip)
    if (target === null) return

    stopScrollMotion()
    scrollAnimationRef.current = animate(track.scrollLeft, target, {
      ...CHIP_SCROLL_SPRING,
      onUpdate: (latest) => {
        track.scrollLeft = latest
      },
    })
  }, [items, stopScrollMotion])

  useEffect(() => {
    initialScrollDoneRef.current = false
    stopScrollMotion()
    const track = trackRef.current
    if (track) track.scrollLeft = 0
  }, [items, stopScrollMotion])

  useEffect(() => {
    if (initialScrollDoneRef.current || selectedValues.length === 0) return
    initialScrollDoneRef.current = true
    scrollChipIntoView(selectedValues[selectedValues.length - 1]!)
  }, [selectedValues, scrollChipIntoView])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      stopScrollMotion()
      event.preventDefault()
      event.stopPropagation()
      track.scrollLeft += event.deltaY
    }

    track.addEventListener('wheel', onWheel, { passive: false })
    return () => track.removeEventListener('wheel', onWheel)
  }, [stopScrollMotion])

  const handleToggle = useCallback(
    (value: string) => {
      if (dragRef.current.moved) return
      const isSelecting = !selectedValues.includes(value)
      onToggle(value)
      if (isSelecting) {
        requestAnimationFrame(() => scrollChipIntoView(value))
      }
    },
    [onToggle, selectedValues, scrollChipIntoView],
  )

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    stopScrollMotion()
    dragRef.current = {
      active: true,
      captured: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    }
  }, [stopScrollMotion])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    const track = event.currentTarget
    const dx = event.clientX - drag.startX

    if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      drag.moved = true
      drag.captured = true
      drag.startX = event.clientX
      drag.scrollLeft = track.scrollLeft
      drag.lastX = event.clientX
      drag.lastTime = performance.now()
      drag.velocity = 0
      track.setPointerCapture(event.pointerId)
      setIsGrabbing(true)
    }

    if (!drag.moved) return

    event.preventDefault()
    track.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX)

    const now = performance.now()
    const elapsed = now - drag.lastTime
    if (elapsed > 0) {
      drag.velocity = (event.clientX - drag.lastX) / elapsed
    }
    drag.lastX = event.clientX
    drag.lastTime = now
  }, [])

  const startInertia = useCallback((velocity: number) => {
    stopScrollMotion()
    const track = trackRef.current
    if (!track) return

    let speed = velocity * 16

    const step = () => {
      if (Math.abs(speed) < 0.25) {
        inertiaFrameRef.current = null
        return
      }

      track.scrollLeft -= speed
      speed *= 0.92
      inertiaFrameRef.current = requestAnimationFrame(step)
    }

    inertiaFrameRef.current = requestAnimationFrame(step)
  }, [stopScrollMotion])

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    const track = event.currentTarget
    const wasMoved = drag.moved
    const velocity = drag.velocity

    drag.active = false
    drag.moved = false

    if (drag.captured) {
      track.releasePointerCapture(event.pointerId)
      setIsGrabbing(false)
    }

    if (wasMoved) {
      startInertia(velocity)
    }
  }, [startInertia])

  return (
    <div
      className={cn('track', { grabbing: isGrabbing })}
      ref={trackRef}
      role="group"
      aria-label="Sottocategorie"
      data-lenis-prevent
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div ref={innerRef} className={cn('trackInner')}>
        {items.map((item) => {
          const selected = selectedValues.includes(item.value)
          return (
            <div key={item.value} className={cn('trackItem')}>
              <FilterChip
                label={item.label}
                selected={selected}
                size="small"
                onClick={() => handleToggle(item.value)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ProductFilters({
  value,
  onChange,
  entries,
  className,
}: ProductFiltersProps) {
  const parsed = useMemo(
    () => parseFiltriEntries(entries ?? getBundledFiltriEntries()),
    [entries],
  )

  const activeCategory = value.category

  const subcategoryItems = useMemo(() => {
    if (!activeCategory) return []
    return getSubfiltersForCategory(activeCategory, parsed).map((entry) => ({
      value: entry.value,
      label: getSubfilterLabel(entry.name),
    }))
  }, [activeCategory, parsed])

  const handleSubcategoryToggle = useCallback(
    (subValue: string) => {
      if (!activeCategory) return

      const isSelected = value.subcategories.includes(subValue)
      const subcategories = isSelected
        ? value.subcategories.filter((v) => v !== subValue)
        : [...value.subcategories, subValue]

      onChange({
        category: activeCategory,
        subcategories,
      })
    },
    [activeCategory, onChange, value.subcategories],
  )

  if (!activeCategory || subcategoryItems.length === 0) {
    return null
  }

  return (
    <div className={cn('wrapper', className)}>
      <FilterChipRow
        items={subcategoryItems}
        selectedValues={value.subcategories}
        onToggle={handleSubcategoryToggle}
      />
    </div>
  )
}

export { getParsedBundledFiltri }

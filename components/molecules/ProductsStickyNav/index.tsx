'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import Icon from '@/components/atoms/Icon'
import type { ProductsFilterState, ProductsSortMode } from '@/lib/products/types'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type Option = { value: string; label: string }

export type ProductsStickyNavProps = {
  filters: ProductsFilterState
  categoryOptions: Option[]
  applicationAreaOptions: Option[]
  onCategoryChange: (value: string | null) => void
  onApplicationAreaChange: (value: string | null) => void
  onSortChange: (sort: ProductsSortMode) => void
  onViewChange: (view: ProductsFilterState['view']) => void
  className?: string
  solutionsLabel?: string
  sectorsLabel?: string
  interestedLabel?: string
  sortLabel?: string
  allSolutionsLabel?: string
  allSectorsLabel?: string
}

type FilterDropdownProps = {
  value: string | null
  options: Option[]
  placeholder: string
  onChange: (value: string | null) => void
  variant?: 'select' | 'sort'
  sortLabel?: string
}

type PanelPosition = {
  top: number
  left?: number
  right?: number
}

function FilterDropdown({
  value,
  options,
  placeholder,
  onChange,
  variant = 'select',
  sortLabel = 'Ordina per',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null)
  const [scrollState, setScrollState] = useState({
    canScrollTop: false,
    canScrollBottom: false,
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isSort = variant === 'sort'
  const selected = options.find((o) => o.value === value)

  const updatePanelPosition = useCallback(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root) return

    const nav = root.closest('[data-products-sticky-nav]') as HTMLElement | null
    const inner = nav?.querySelector('[data-sticky-nav-inner]') as HTMLElement | null
    const trigger = root.querySelector('button')
    if (!inner || !trigger) return

    const innerRect = inner.getBoundingClientRect()
    const triggerRect = trigger.getBoundingClientRect()
    const rootRect = root.getBoundingClientRect()
    const panelWidth = panel?.offsetWidth ?? 186
    const viewportPadding = 16

    const top = innerRect.bottom - rootRect.top + 1

    if (isSort) {
      setPanelPosition({ top, right: 0 })
      return
    }

    let left = triggerRect.left - rootRect.left
    const panelRightInViewport = triggerRect.left + panelWidth

    if (panelRightInViewport > window.innerWidth - viewportPadding) {
      left = Math.max(0, triggerRect.right - rootRect.left - panelWidth)
    }

    setPanelPosition({ top, left })
  }, [isSort])

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
    const onDoc = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setPanelPosition(null)
      return
    }

    updatePanelPosition()
  }, [open, options, updatePanelPosition])

  useEffect(() => {
    if (!open) return

    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && scrollRef.current?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', updatePanelPosition)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', updatePanelPosition)
    }
  }, [open, updatePanelPosition])

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

  const triggerLabel = isSort
    ? sortLabel
    : (selected?.label ?? placeholder)

  return (
    <div className={cn('dropdown', { sort: isSort })} ref={rootRef}>
      <button
        type="button"
        className={cn('dropdownTrigger', { open, sort: isSort })}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={cn('dropdownTriggerLabel')}>{triggerLabel}</span>
        {isSort ? (
          <Icon type="sort-2" size="m" weight="normal" className={cn('sortIcon')} />
        ) : (
          <Icon
            type="chevron-down"
            size="m"
            weight="normal"
            className={cn('chevron', { open })}
          />
        )}
      </button>
      {open ? (
        <div
          ref={panelRef}
          className={cn('dropdownPanel')}
          role="listbox"
          style={
            panelPosition
              ? {
                  top: panelPosition.top,
                  ...(panelPosition.right !== undefined
                    ? { right: panelPosition.right, left: 'auto' }
                    : { left: panelPosition.left }),
                }
              : undefined
          }
        >
          <div className={cn('dropdownScrollArea')}>
            <div
              ref={scrollRef}
              className={cn('dropdownScroll')}
              data-lenis-prevent
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {options.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn('dropdownOption', { selected: option.value === value })}
                  onClick={() => {
                    onChange(option.value || null)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {scrollState.canScrollTop ? (
            <div className={cn('dropdownFade', 'top')} aria-hidden />
          ) : null}
          {scrollState.canScrollBottom ? (
            <div className={cn('dropdownFade', 'bottom')} aria-hidden />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function ProductsStickyNav({
  filters,
  categoryOptions,
  applicationAreaOptions,
  onCategoryChange,
  onApplicationAreaChange,
  onSortChange,
  onViewChange,
  className,
  solutionsLabel = 'Soluzioni',
  sectorsLabel = 'Settori',
  interestedLabel = 'Sono interessato a',
  sortLabel = 'Ordina per',
  allSolutionsLabel = 'Tutte le soluzioni',
  allSectorsLabel = 'Tutti i settori',
}: ProductsStickyNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const solutionOptions = [
    { value: '', label: allSolutionsLabel },
    ...categoryOptions,
  ]

  const sectorOptions = [
    { value: '', label: allSectorsLabel },
    ...applicationAreaOptions,
  ]

  const sortOptions: Option[] = [
    { value: 'recent', label: 'Ultimi aggiunti' },
    { value: 'alphabetical', label: 'Ordine alfabetico' },
  ]

  const toggleSort = () => {
    onSortChange(filters.sort === 'recent' ? 'alphabetical' : 'recent')
  }

  const toggleView = () => {
    onViewChange(filters.view === 'grid' ? 'list' : 'grid')
  }

  const activeFilterCount =
    (filters.category ? 1 : 0) + (filters.applicationArea ? 1 : 0)

  const mobileTabLabel =
    activeFilterCount > 0
      ? `${interestedLabel} (+${activeFilterCount})`
      : interestedLabel

  return (
    <div className={cn('wrapper', className)} data-products-sticky-nav>
      <div className={cn('inner')} data-sticky-nav-inner>
        <div className={cn('toolbar')}>
          <div className={cn('bar')}>
            <div className={cn('barInner')}>
              <p className={cn('label')}>{interestedLabel}</p>
              <div className={cn('divider')} aria-hidden />
              <FilterDropdown
                value={filters.category ?? ''}
                options={solutionOptions}
                placeholder={allSolutionsLabel}
                onChange={(value) => onCategoryChange(value || null)}
              />
              <div className={cn('divider')} aria-hidden />
              <FilterDropdown
                value={filters.applicationArea ?? ''}
                options={sectorOptions}
                placeholder={allSectorsLabel}
                onChange={(value) => onApplicationAreaChange(value || null)}
              />
              <div className={cn('divider')} aria-hidden />
            </div>
            <div className={cn('viewToggles')} aria-label="Visualizzazione prodotti">
              <button
                type="button"
                className={cn('viewToggle', { active: filters.view === 'grid' })}
                aria-label="Vista griglia"
                aria-pressed={filters.view === 'grid'}
                onClick={() => onViewChange('grid')}
              >
                <Icon type="grid-filled" size="ml" weight="normal" />
              </button>
              <button
                type="button"
                className={cn('viewToggle', { active: filters.view === 'list' })}
                aria-label="Vista righe"
                aria-pressed={filters.view === 'list'}
                onClick={() => onViewChange('list')}
              >
                <Icon type="row-filled" size="ml" weight="normal" />
              </button>
            </div>
          </div>

          <div className={cn('mobileNav')}>
            <div className={cn('mobileTab')}>
              <button
                type="button"
                className={cn('mobileTabInner')}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <span className={cn('mobileTitle')}>{mobileTabLabel}</span>
                <Icon
                  type="chevron-down"
                  size="l"
                  weight="normal"
                  className={cn('mobileChevron', { open: mobileOpen })}
                />
              </button>
            </div>
            <button
              type="button"
              className={cn('iconButton', { active: filters.view === 'grid' })}
              aria-label={filters.view === 'grid' ? 'Vista griglia' : 'Vista righe'}
              aria-pressed={filters.view === 'grid'}
              onClick={toggleView}
            >
              <Icon
                type={filters.view === 'grid' ? 'grid-filled' : 'row-filled'}
                size="ml"
                weight="normal"
              />
            </button>
            <button
              type="button"
              className={cn('iconButton')}
              aria-label={sortLabel}
              onClick={toggleSort}
            >
              <Icon type="sort-2" size="m" weight="normal" />
            </button>
          </div>
        </div>

        <FilterDropdown
          value={filters.sort}
          options={sortOptions}
          placeholder={sortLabel}
          variant="sort"
          sortLabel={sortLabel}
          onChange={(value) => {
            if (value === 'recent' || value === 'alphabetical') {
              onSortChange(value)
            }
          }}
        />
      </div>

      {mobileOpen ? (
        <div className={cn('mobilePanel')}>
          <div className={cn('mobileGroup')}>
            <p className={cn('mobileGroupLabel')}>{solutionsLabel}</p>
            {solutionOptions.map((option) => (
              <button
                key={option.value || 'all-solutions'}
                type="button"
                className={cn('mobileOption', {
                  selected: (filters.category ?? '') === option.value,
                })}
                onClick={() => {
                  onCategoryChange(option.value || null)
                  setMobileOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={cn('mobileGroup')}>
            <p className={cn('mobileGroupLabel')}>{sectorsLabel}</p>
            {sectorOptions.map((option) => (
              <button
                key={option.value || 'all-sectors'}
                type="button"
                className={cn('mobileOption', {
                  selected: (filters.applicationArea ?? '') === option.value,
                })}
                onClick={() => {
                  onApplicationAreaChange(option.value || null)
                  setMobileOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

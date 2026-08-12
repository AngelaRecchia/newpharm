'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames/bind'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Icon from '@/components/atoms/Icon'
import { useScrollLock } from '@/lib/context/smooth-scroll-context'
import type { ProductsFilterState, ProductsSortMode } from '@/lib/products/types'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const MOBILE_PANEL_EASE = [0.4, 0, 0.2, 1] as const
const MOBILE_EXPAND_EASE = [0.22, 1, 0.36, 1] as const

const mobilePanelVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
    opacity: direction === 0 ? 1 : 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : direction < 0 ? '100%' : 0,
    opacity: 0,
  }),
}

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
  /** Offset dal bottom per compare/download bar (es. 6.5rem) */
  barOffset?: string
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
    ? (selected?.label ?? sortLabel)
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

type MobileSubPanel = 'sectors' | 'solutions' | 'sort' | null

type MobileScrollListProps = {
  children: ReactNode
  className?: string
  gap?: 'default' | 'compact'
}

function MobileScrollList({ children, className, gap = 'default' }: MobileScrollListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({
    canScrollTop: false,
    canScrollBottom: false,
  })

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
  }, [children, updateScrollState])

  return (
    <div className={cn('mobileScrollArea', className)}>
      <div
        ref={scrollRef}
        className={cn('mobileScroll', { compact: gap === 'compact' })}
        data-lenis-prevent
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        {children}
      </div>
      {scrollState.canScrollTop ? (
        <div className={cn('mobileScrollFade', 'top')} aria-hidden />
      ) : null}
      {scrollState.canScrollBottom ? (
        <div className={cn('mobileScrollFade', 'bottom')} aria-hidden />
      ) : null}
    </div>
  )
}

type MobileOptionListProps = {
  title: string
  options: Option[]
  value: string
  onSelect: (value: string) => void
  onBack: () => void
}

function MobileOptionList({ title, options, value, onSelect, onBack }: MobileOptionListProps) {
  return (
    <div className={cn('mobileSubPanel')}>
      <button type="button" className={cn('mobileSubPanelBack')} onClick={onBack}>
        <Icon type="chevron-left" size="l" weight="normal" />
        <span>{title}</span>
      </button>
      <MobileScrollList gap="compact">
        {options.map((option) => (
          <button
            key={option.value || 'all'}
            type="button"
            className={cn('mobileOption', { selected: value === option.value })}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </MobileScrollList>
    </div>
  )
}

function MobileNavTab({
  label,
  onClick,
  chevron = 'right',
  expanded = false,
}: {
  label: string
  onClick: () => void
  chevron?: 'right' | 'down'
  expanded?: boolean
}) {
  return (
    <button type="button" className={cn('mobileNavTab')} onClick={onClick}>
      <span className={cn('mobileNavTabLabel')}>{label}</span>
      <span className={cn('mobileNavTabIcon')} aria-hidden>
        <Icon
          type={chevron === 'right' ? 'chevron-right' : 'chevron-down'}
          size="m"
          weight="normal"
          className={cn('mobileNavTabChevron', { expanded, down: chevron === 'down' })}
        />
      </span>
    </button>
  )
}

function MobileStickyBar({
  mobileOpen,
  mobileSubPanel,
  setMobileSubPanel,
  selectedSectorLabel,
  selectedCategoryLabel,
  sectorOptions,
  solutionOptions,
  sortOptions,
  filters,
  interestedLabel,
  sectorsLabel,
  solutionsLabel,
  sortLabel,
  onApplicationAreaChange,
  onCategoryChange,
  onSortChange,
  onViewChange,
  toggleMobile,
  setMobileOpen,
  barOffset = '0px',
  panelDirection,
  onOpenSubPanel,
  onBackToMain,
}: {
  mobileOpen: boolean
  mobileSubPanel: MobileSubPanel
  setMobileSubPanel: (value: MobileSubPanel | ((current: MobileSubPanel) => MobileSubPanel)) => void
  selectedSectorLabel: string
  selectedCategoryLabel: string
  sectorOptions: Option[]
  solutionOptions: Option[]
  sortOptions: Option[]
  filters: ProductsFilterState
  interestedLabel: string
  sectorsLabel: string
  solutionsLabel: string
  sortLabel: string
  onApplicationAreaChange: (value: string | null) => void
  onCategoryChange: (value: string | null) => void
  onSortChange: (sort: ProductsSortMode) => void
  onViewChange: (view: ProductsFilterState['view']) => void
  toggleMobile: () => void
  setMobileOpen: (value: boolean) => void
  barOffset?: string
  panelDirection: number
  onOpenSubPanel: (panel: Exclude<MobileSubPanel, null>) => void
  onBackToMain: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const reduceMotion = useReducedMotion()
  const panelKey = mobileSubPanel ?? 'main'

  useEffect(() => {
    setMounted(true)
  }, [])

  useScrollLock(mobileOpen)

  if (!mounted) return null

  return createPortal(
    <div
      className={cn('mobileNavFixed')}
      data-products-mobile-nav
      style={{ '--products-bar-offset': barOffset } as CSSProperties}
    >
      <div className={cn('mobileShell')}>
        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              key="mobile-panel-expand"
              className={cn('mobilePanelExpand')}
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{
                height: {
                  duration: reduceMotion ? 0.01 : 0.42,
                  ease: MOBILE_EXPAND_EASE,
                },
                opacity: {
                  duration: reduceMotion ? 0.01 : 0.3,
                  ease: MOBILE_PANEL_EASE,
                },
              }}
            >
              <motion.div
                className={cn('mobilePanelViewport')}
                initial={reduceMotion ? false : { y: 12 }}
                animate={{ y: 0 }}
                exit={reduceMotion ? undefined : { y: 12 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.42,
                  ease: MOBILE_EXPAND_EASE,
                }}
              >
                <AnimatePresence mode="wait" custom={panelDirection} initial={false}>
                  <motion.div
                    key={panelKey}
                    custom={panelDirection}
                    variants={mobilePanelVariants}
                    initial={reduceMotion ? false : 'enter'}
                    animate="center"
                    exit={reduceMotion ? undefined : 'exit'}
                    transition={{
                      duration: reduceMotion ? 0.01 : 0.28,
                      ease: MOBILE_PANEL_EASE,
                    }}
                    className={cn('mobilePanelStage')}
                  >
                    {mobileSubPanel === null ? (
                      <div className={cn('mobileInner')}>
                        <MobileNavTab
                          label={selectedSectorLabel}
                          onClick={() => onOpenSubPanel('sectors')}
                        />
                        <MobileNavTab
                          label={selectedCategoryLabel}
                          onClick={() => onOpenSubPanel('solutions')}
                        />
                      </div>
                    ) : null}

                    {mobileSubPanel === 'sectors' ? (
                      <MobileOptionList
                        title={sectorsLabel}
                        options={sectorOptions}
                        value={filters.applicationArea ?? ''}
                        onBack={onBackToMain}
                        onSelect={(value) => {
                          onApplicationAreaChange(value || null)
                          onBackToMain()
                        }}
                      />
                    ) : null}

                    {mobileSubPanel === 'solutions' ? (
                      <MobileOptionList
                        title={solutionsLabel}
                        options={solutionOptions}
                        value={filters.category ?? ''}
                        onBack={onBackToMain}
                        onSelect={(value) => {
                          onCategoryChange(value || null)
                          onBackToMain()
                        }}
                      />
                    ) : null}

                    {mobileSubPanel === 'sort' ? (
                      <MobileOptionList
                        title={sortLabel}
                        options={sortOptions}
                        value={filters.sort}
                        onBack={onBackToMain}
                        onSelect={(value) => {
                          if (
                            value === 'recent' ||
                            value === 'alphabetical' ||
                            value === 'bestsellers'
                          ) {
                            onSortChange(value)
                          }
                          onBackToMain()
                        }}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className={cn('mobileNavRow')}>
          <div className={cn('mobileTab')}>
            <MobileNavTab
              label={interestedLabel}
              chevron="down"
              expanded={mobileOpen}
              onClick={toggleMobile}
            />
          </div>
          <button
            type="button"
            className={cn('iconButton', { active: filters.view === 'grid' })}
            aria-label={filters.view === 'grid' ? 'Vista griglia' : 'Vista righe'}
            aria-pressed={filters.view === 'grid'}
            onClick={() => onViewChange(filters.view === 'grid' ? 'list' : 'grid')}
          >
            <Icon
              type={filters.view === 'grid' ? 'grid-filled' : 'row-filled'}
              size="ml"
              weight="normal"
            />
          </button>
          <button
            type="button"
            className={cn('iconButton', { active: mobileSubPanel === 'sort' })}
            aria-label={sortLabel}
            aria-expanded={mobileSubPanel === 'sort'}
            onClick={() => {
              if (!mobileOpen) {
                setMobileOpen(true)
                onOpenSubPanel('sort')
                return
              }
              if (mobileSubPanel === 'sort') {
                onBackToMain()
                return
              }
              onOpenSubPanel('sort')
            }}
          >
            <Icon type="sort-2" size="m" weight="normal" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
  barOffset = '0px',
}: ProductsStickyNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSubPanel, setMobileSubPanel] = useState<MobileSubPanel>(null)
  const [panelDirection, setPanelDirection] = useState(0)

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
    { value: 'bestsellers', label: 'Bestsellers' },
  ]

  const selectedCategoryLabel =
    categoryOptions.find((option) => option.value === filters.category)?.label ??
    allSolutionsLabel

  const selectedSectorLabel =
    applicationAreaOptions.find((option) => option.value === filters.applicationArea)?.label ??
    allSectorsLabel

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileSubPanel(null)
    setPanelDirection(0)
  }

  const openMobile = () => {
    setPanelDirection(0)
    setMobileOpen(true)
    setMobileSubPanel(null)
  }

  const openSubPanel = (panel: Exclude<MobileSubPanel, null>) => {
    setPanelDirection(1)
    setMobileSubPanel(panel)
  }

  const backToMain = () => {
    setPanelDirection(-1)
    setMobileSubPanel(null)
  }

  const toggleMobile = () => {
    if (mobileOpen) {
      closeMobile()
      return
    }
    openMobile()
  }

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
        </div>

        <FilterDropdown
          value={filters.sort}
          options={sortOptions}
          placeholder={sortLabel}
          variant="sort"
          sortLabel={sortLabel}
          onChange={(value) => {
            if (value === 'recent' || value === 'alphabetical' || value === 'bestsellers') {
              onSortChange(value)
            }
          }}
        />
      </div>

      <MobileStickyBar
        mobileOpen={mobileOpen}
        mobileSubPanel={mobileSubPanel}
        setMobileSubPanel={setMobileSubPanel}
        selectedSectorLabel={selectedSectorLabel}
        selectedCategoryLabel={selectedCategoryLabel}
        sectorOptions={sectorOptions}
        solutionOptions={solutionOptions}
        sortOptions={sortOptions}
        filters={filters}
        interestedLabel={interestedLabel}
        sectorsLabel={sectorsLabel}
        solutionsLabel={solutionsLabel}
        sortLabel={sortLabel}
        onApplicationAreaChange={onApplicationAreaChange}
        onCategoryChange={onCategoryChange}
        onSortChange={onSortChange}
        onViewChange={onViewChange}
        toggleMobile={toggleMobile}
        setMobileOpen={setMobileOpen}
        barOffset={barOffset}
        panelDirection={panelDirection}
        onOpenSubPanel={openSubPanel}
        onBackToMain={backToMain}
      />
    </div>
  )
}

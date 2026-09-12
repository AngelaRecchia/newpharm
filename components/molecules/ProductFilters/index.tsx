'use client'

import { useCallback, useMemo, useRef } from 'react'
import classNames from 'classnames/bind'
import { FreeMode, Mousewheel } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
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
  const swiperRef = useRef<import('swiper').Swiper | null>(null)

  const handleToggle = useCallback(
    (value: string) => {
      const isSelecting = !selectedValues.includes(value)
      onToggle(value)
      if (isSelecting) {
        const index = items.findIndex((item) => item.value === value)
        if (index >= 0) {
          requestAnimationFrame(() => swiperRef.current?.slideTo(index))
        }
      }
    },
    [items, onToggle, selectedValues],
  )

  return (
    <div className={cn('track')} role="group" aria-label="Sottocategorie" data-lenis-prevent>
      <Swiper
        className={cn('swiper')}
        modules={[FreeMode, Mousewheel]}
        freeMode
        grabCursor
        mousewheel={{ forceToAxis: true, sensitivity: 1 }}
        slidesPerView="auto"
        spaceBetween={12}
        breakpoints={{ 768: { spaceBetween: 16 } }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
      >
        {items.map((item) => {
          const selected = selectedValues.includes(item.value)
          return (
            <SwiperSlide key={item.value} className={cn('trackItem')}>
              <FilterChip
                label={item.label}
                selected={selected}
                size="small"
                onClick={() => handleToggle(item.value)}
              />
            </SwiperSlide>
          )
        })}
      </Swiper>
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

'use client'

import { useCallback, useMemo } from 'react'
import classNames from 'classnames/bind'
import FilterChips from '@/components/molecules/FilterChips'
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
    return getSubfiltersForCategory(activeCategory, parsed).map((entry) => entry.value)
  }, [activeCategory, parsed])

  const labelFor = useCallback(
    (subValue: string) => {
      if (!activeCategory) return subValue
      const entry = getSubfiltersForCategory(activeCategory, parsed).find(
        (item) => item.value === subValue,
      )
      return entry ? getSubfilterLabel(entry.name) : subValue
    },
    [activeCategory, parsed],
  )

  const handleChange = useCallback(
    (subcategories: string[]) => {
      if (!activeCategory) return
      onChange({
        category: activeCategory,
        subcategories,
      })
    },
    [activeCategory, onChange],
  )

  if (!activeCategory || subcategoryItems.length === 0) {
    return null
  }

  return (
    <div className={cn('wrapper', className)}>
      <FilterChips
        items={subcategoryItems}
        value={value.subcategories}
        onChange={handleChange}
        size="s"
        showAll={false}
        ariaLabel="Sottocategorie"
        getLabel={labelFor}
      />
    </div>
  )
}

export { getParsedBundledFiltri }

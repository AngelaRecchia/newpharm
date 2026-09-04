'use client'

import { useCallback } from 'react'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import FilterChip, { type FilterChipSize } from '@/components/atoms/FilterChip'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type FilterChipsProps<T extends string> = {
  items: readonly T[]
  value: T[]
  onChange: (value: T[]) => void
  className?: string
  dark?: boolean
  size?: FilterChipSize
  ariaLabel?: string
  getLabel?: (item: T) => string
  showAll?: boolean
  exclusive?: boolean
  hoverBlack?: boolean
}

export default function FilterChips<T extends string>({
  items,
  value,
  onChange,
  className,
  dark = false,
  size = 'large',
  ariaLabel,
  getLabel,
  showAll = true,
  exclusive = false,
  hoverBlack = false,
}: FilterChipsProps<T>) {
  const t = useTranslations('')
  const allSelected = showAll && value.length === 0

  const handleAll = useCallback(() => {
    onChange([] as T[])
  }, [onChange])

  const handleToggle = useCallback(
    (item: T) => {
      if (exclusive) {
        if (value.length === 1 && value[0] === item) return
        onChange([item])
        return
      }

      const selected = value.includes(item)
      onChange(
        selected ? value.filter((current) => current !== item) : [...value, item],
      )
    },
    [exclusive, onChange, value],
  )

  return (
    <div className={cn('wrapper', className)}>
      <div
        className={cn('track')}
        role="group"
        aria-label={ariaLabel}
        data-lenis-prevent
      >
        <div className={cn('trackInner')}>
          {showAll ? (
            <div className={cn('trackItem')}>
              <FilterChip
                label={t('all')}
                selected={allSelected}
                size={size}
                dark={dark}
                hoverBlack={hoverBlack}
                onClick={handleAll}
              />
            </div>
          ) : null}
          {items.map((item) => {
            const key: string = item
            return (
            <div key={item} className={cn('trackItem')}>
              <FilterChip
                label={getLabel ? getLabel(item) : t(key)}
                selected={value.includes(item)}
                size={size}
                dark={dark}
                hoverBlack={hoverBlack}
                onClick={() => handleToggle(item)}
              />
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

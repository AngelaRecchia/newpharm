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
}

export default function FilterChips<T extends string>({
  items,
  value,
  onChange,
  className,
  dark = false,
  size = 'large',
  ariaLabel,
}: FilterChipsProps<T>) {
  const t = useTranslations('')
  const allSelected = value.length === 0

  const handleAll = useCallback(() => {
    onChange([] as T[])
  }, [onChange])

  const handleToggle = useCallback(
    (item: T) => {
      const selected = value.includes(item)
      onChange(
        selected ? value.filter((current) => current !== item) : [...value, item],
      )
    },
    [onChange, value],
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
          <div className={cn('trackItem')}>
            <FilterChip
              label={t('all')}
              selected={allSelected}
              size={size}
              dark={dark}
              onClick={handleAll}
            />
          </div>
          {items.map((item) => {
            const key: string = item
            return (
            <div key={item} className={cn('trackItem')}>
              <FilterChip
                label={t(key)}
                selected={value.includes(item)}
                size={size}
                dark={dark}
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

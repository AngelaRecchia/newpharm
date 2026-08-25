'use client'

import { useCallback } from 'react'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import FilterChip from '@/components/atoms/FilterChip'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type FilterChipsProps<T extends string> = {
  items: readonly T[]
  value: T[]
  onChange: (value: T[]) => void
  className?: string
  dark?: boolean
  ariaLabel?: string
}

export default function FilterChips<T extends string>({
  items,
  value,
  onChange,
  className,
  dark = false,
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
              size="large"
              dark={dark}
              onClick={handleAll}
            />
          </div>
          {items.map((item) => (
            <div key={item} className={cn('trackItem')}>
              <FilterChip
                label={t(item)}
                selected={value.includes(item)}
                size="large"
                dark={dark}
                onClick={() => handleToggle(item)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useRef } from 'react'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import type { SwiperClass } from 'swiper/react'
import FilterChip, { type FilterChipSize } from '@/components/atoms/FilterChip'
import ChipSwiper, { ChipSwiperSlide } from '@/components/molecules/ChipSwiper'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type FilterChipsProps<T extends string> = {
  items: readonly T[]
  value: T[]
  onChange: (value: T[]) => void
  className?: string
  dark?: boolean
  /** `s` search/tabs, `m` listing filtri (product/stories). Default `s`. */
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
  size = 's',
  ariaLabel,
  getLabel,
  showAll = true,
  exclusive = false,
  hoverBlack = false,
}: FilterChipsProps<T>) {
  const t = useTranslations('')
  const swiperRef = useRef<SwiperClass | null>(null)
  const allSelected = showAll && value.length === 0

  const handleAll = useCallback(() => {
    onChange([] as T[])
  }, [onChange])

  const handleToggle = useCallback(
    (item: T, slideIndex: number) => {
      if (exclusive) {
        if (value.length === 1 && value[0] === item) return
        onChange([item])
        requestAnimationFrame(() => swiperRef.current?.slideTo(slideIndex))
        return
      }

      const selected = value.includes(item)
      onChange(
        selected ? value.filter((current) => current !== item) : [...value, item],
      )
      if (!selected) {
        requestAnimationFrame(() => swiperRef.current?.slideTo(slideIndex))
      }
    },
    [exclusive, onChange, value],
  )

  const allSlideOffset = showAll ? 1 : 0

  return (
    <div className={cn('wrapper', className)} role="group" aria-label={ariaLabel}>
      <ChipSwiper size={size} swiperRef={swiperRef}>
        {showAll ? (
          <ChipSwiperSlide>
            <FilterChip
              label={t('all')}
              selected={allSelected}
              size={size}
              dark={dark}
              hoverBlack={hoverBlack}
              onClick={handleAll}
            />
          </ChipSwiperSlide>
        ) : null}
        {items.map((item, index) => (
          <ChipSwiperSlide key={item}>
            <FilterChip
              label={getLabel ? getLabel(item) : t(item as never)}
              selected={value.includes(item)}
              size={size}
              dark={dark}
              hoverBlack={hoverBlack}
              onClick={() => handleToggle(item, index + allSlideOffset)}
            />
          </ChipSwiperSlide>
        ))}
      </ChipSwiper>
    </div>
  )
}

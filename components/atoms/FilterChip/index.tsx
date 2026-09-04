'use client'

import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type FilterChipSize = 'large' | 'small'

export type FilterChipProps = {
  label: string
  selected?: boolean
  size?: FilterChipSize
  dark?: boolean
  hoverBlack?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export default function FilterChip({
  label,
  selected = false,
  size = 'large',
  dark = false,
  hoverBlack = false,
  className,
  onClick,
  disabled = false,
}: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn('chip', size, { selected, dark, hoverBlack }, className)}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={cn('label')}>{label}</span>
    </button>
  )
}

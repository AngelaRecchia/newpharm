'use client'

import { useMemo } from 'react'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items: (number | 'ellipsis')[] = [1]

  if (current > 3) items.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (current < total - 2) items.push('ellipsis')

  items.push(total)
  return items
}

export default function PaginationNumbers({
  currentPage,
  totalPages,
  onPageChange,
  dark = false,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  dark?: boolean
}) {
  const items = useMemo(
    () => buildPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  )

  if (totalPages <= 1) return null

  return (
    <nav className={cn('wrapper', { dark })} aria-label="Pagination">
      <div className={cn('nav')}>
        <Button
          icon="chevron-left"
          variant="tertiary"
          size="small"
          weight="normal"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        />
      </div>

      <div className={cn('pages')}>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={cn('ellipsis')} aria-hidden>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn('page', { active: item === currentPage })}
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <div className={cn('nav')}>
        <Button
          icon="chevron-right"
          variant="tertiary"
          size="small"
          weight="normal"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        />
      </div>
    </nav>
  )
}

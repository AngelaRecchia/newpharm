'use client'

import { useMemo } from 'react'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import type { ProductBarItem } from '@/lib/products/productBarTypes'
import { COMPARE_MAX } from '@/lib/products/productBarTypes'
import ProductActionBar from '@/components/molecules/ProductActionBar'
import { buildCompareProductsSearchParams } from '@/lib/products/compareQuery'
import { buildStoryblokNavigationHref } from '@/lib/api/utils/links'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ProductCompareBarProps {
  open: boolean
  items: ProductBarItem[]
  comparisonPageUrl?: string | null
  onClose: () => void
  onRemove: (uuid: string) => void
}

export default function ProductCompareBar({
  open,
  items,
  comparisonPageUrl,
  onClose,
  onRemove,
}: ProductCompareBarProps) {
  const t = useTranslations('')

  const compareLabel = t('compare')
  const addProductsLabel = t('add_products')
  const removeHint = t('click_image_to_remove')

  const slots = Array.from({ length: COMPARE_MAX }, (_, index) => items[index] ?? null)

  const compareHref = useMemo(() => {
    if (!comparisonPageUrl || items.length === 0) return undefined

    return buildStoryblokNavigationHref(
      comparisonPageUrl,
      buildCompareProductsSearchParams(items.map((item) => item.uuid)),
    )
  }, [comparisonPageUrl, items])

  return (
    <ProductActionBar
      open={open && items.length > 0}
      variant="compare"
      onClose={onClose}
      ariaLabel={compareLabel}
    >
      <div className={cn('layout')}>
        <div className={cn('left')}>
          <ul className={cn('slots')} aria-label={addProductsLabel}>
            {slots.map((item, index) => (
              <li key={item?.uuid ?? `empty-${index}`} className={cn('slot')}>
                {item ? (
                  <button
                    type="button"
                    className={cn('slotButton', 'filled')}
                    onClick={() => onRemove(item.uuid)}
                    aria-label={`${compareLabel}: ${item.title}`}
                  >
                    {item.image ? (
                      <Asset asset={item.image} size="s" mode="fit" />
                    ) : null}
                  </button>
                ) : (
                  <span className={cn('slotEmpty')} aria-hidden />
                )}
              </li>
            ))}
          </ul>
          <div className={cn('copy')}>
            <p className={cn('copyTitle')}>{addProductsLabel}</p>
            <p className={cn('copyHint')}>{removeHint}</p>
          </div>
        </div>
        <div className={cn('right')}>
          <Button
            variant="secondary"
            size="small"
            label={compareLabel}
            icon="right-small"
            iconAlwaysVisible
            href={compareHref}
            disabled={!compareHref}
            className={cn('compareButton')}
          />
        </div>
      </div>
    </ProductActionBar>
  )
}

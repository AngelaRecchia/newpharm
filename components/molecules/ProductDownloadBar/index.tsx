'use client'

import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import Icon from '@/components/atoms/Icon'
import type { ProductBarItem } from '@/lib/products/productBarTypes'
import ProductActionBar from '@/components/molecules/ProductActionBar'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ProductDownloadBarProps {
  open: boolean
  items: ProductBarItem[]
  multiMode: boolean
  onClose: () => void
  onRemove: (uuid: string) => void
  onEnableMultiSelect: () => void
  onDownloadAll: () => void
}

export default function ProductDownloadBar({
  open,
  items,
  multiMode,
  onClose,
  onRemove,
  onEnableMultiSelect,
  onDownloadAll,
}: ProductDownloadBarProps) {
  const t = useTranslations('')

  const technicalLabel = t('product_technical_sheet')
  const safetyLabel = t('product_safety_sheet')
  const multiSelectLabel = t('multi_select')
  const downloadAllLabel = t('download_all')
  const removeHint = t('click_image_to_remove')
  const item = items[0] ?? null

  const selectedCountLabel = t('prodotti_selezionati', { n: items.length })

  return (
    <ProductActionBar
      open={open && items.length > 0}
      variant="download"
      multiLine={multiMode}
      onClose={onClose}
      ariaLabel={multiMode ? downloadAllLabel : technicalLabel}
    >
      {multiMode ? (
        <div className={cn('layout', 'multi')}>
          <div className={cn('left')}>
            <ul className={cn('thumbs')} aria-label={selectedCountLabel}>
              {items.map((entry) => (
                <li key={entry.uuid} className={cn('thumbItem')}>
                  <button
                    type="button"
                    className={cn('thumbButton')}
                    onClick={() => onRemove(entry.uuid)}
                    aria-label={`${entry.title} — ${removeHint}`}
                  >
                    {entry.image ? (
                      <Asset asset={entry.image} size="s" mode="fit" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <div className={cn('copy')}>
              <p className={cn('selectedCount')}>{selectedCountLabel}</p>
              <p className={cn('selectedHint')}>{removeHint}</p>
            </div>
          </div>
          <div className={cn('right')}>
            <Button
              variant="secondary"
              size="small"
              label={downloadAllLabel}
              icon="download"
              onClick={onDownloadAll}
            />
          </div>
        </div>
      ) : item ? (
        <div className={cn('layout')}>
          <div className={cn('left')}>
            <div className={cn('thumb')}>
              {item.image ? <Asset asset={item.image} size="s" mode="fit" /> : null}
            </div>
            <div className={cn('links')}>
              <span className={cn('link', 'inert')} aria-disabled="true">
                <span>{technicalLabel}</span>
                <Icon type="download" size="s" weight="normal" className={cn('linkIcon')} />
              </span>
              {item.safetySheetHref ? (
                <a
                  className={cn('link')}
                  href={item.safetySheetHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{safetyLabel}</span>
                  <Icon type="download" size="s" weight="normal" className={cn('linkIcon')} />
                </a>
              ) : null}
            </div>
          </div>
          <div className={cn('right')}>
            <Button
              variant="tertiary"
              size="small"
              label={multiSelectLabel}
              icon="more"
              onClick={onEnableMultiSelect}
            />
          </div>
        </div>
      ) : null}
    </ProductActionBar>
  )
}

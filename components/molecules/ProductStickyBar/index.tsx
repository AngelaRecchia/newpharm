'use client'

import classNames from 'classnames/bind'
import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Icon from '@/components/atoms/Icon'
import Button from '@/components/atoms/Button'
import ProductRequestModal from '@/components/molecules/ProductRequestModal'
import { buildStoryblokNavigationHref } from '@/lib/api/utils/links'
import { buildCompareProductsSearchParams } from '@/lib/products/compareQuery'
import { tSafe } from '@/lib/i18n/tSafe'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ProductStickyBarProps {
  /** uuid della story prodotto — serve per il download PDF e il confronto */
  uuid: string
  /** Titolo del prodotto (per label CTA / aria) */
  title?: string
  /** URL della scheda di sicurezza (se caricata in Storyblok) */
  safetySheetHref?: string | null
  /** URL della pagina confronto (derivata server-side, vedi page.tsx) */
  comparisonPageUrl?: string | null
}

/**
 * Sticky bar del dettaglio prodotto.
 *
 * Desktop: barra sticky sotto l'header con link "Scheda tecnica" (PDF generato),
 * "Scheda di sicurezza" (se caricata) e, a destra, le CTA
 * "Richiedi informazioni" (black) e "Confronta" (white).
 *
 * Mobile: la barra scorre orizzontalmente in overflow; prima le CTA, poi le schede.
 */
export default function ProductStickyBar({
  uuid,
  title,
  safetySheetHref,
  comparisonPageUrl,
}: ProductStickyBarProps) {
  const t = useTranslations('')
  const locale = useLocale()

  const technicalSheetLabel = tSafe(t, 'product_technical_sheet', 'Scheda tecnica')
  const safetySheetLabel = tSafe(t, 'product_safety_sheet', 'Scheda di sicurezza')
  const barLabel = tSafe(t, 'product_bar_label', 'Azioni prodotto')
  const compareLabel = tSafe(t, 'compare', 'Confronta')

  const technicalSheetHref = `/api/products/${uuid}/scheda-tecnica?locale=${locale}`

  // Naviga alla pagina confronto con questo prodotto preinserito nel primo slot
  const compareHref = useCallback(() => {
    if (!comparisonPageUrl) return undefined
    return buildStoryblokNavigationHref(
      comparisonPageUrl,
      buildCompareProductsSearchParams([uuid]),
    )
  }, [comparisonPageUrl, uuid])

  const compareUrl = compareHref()

  if (!uuid) return null

  return (
    <div className={cn('wrapper')} data-product-sticky-bar>
      <nav className={cn('bar')} aria-label={barLabel}>
        {/* Link schede — underline + freccia obliqua */}
        <div className={cn('sheets')}>
          <a
            className={cn('sheetLink')}
            href={technicalSheetHref}
            download
          >
            <span className={cn('sheetLabel')}>{technicalSheetLabel}</span>
            <span className={cn('sheetIcon')} aria-hidden="true">
              <span className={cn('sheetIconTrack')}>
                <Icon type="external" size="s" weight="normal" />
                <Icon type="external" size="s" weight="normal" />
              </span>
            </span>
          </a>

          {safetySheetHref ? (
            <a
              className={cn('sheetLink')}
              href={safetySheetHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={cn('sheetLabel')}>{safetySheetLabel}</span>
              <span className={cn('sheetIcon')} aria-hidden="true">
                <span className={cn('sheetIconTrack')}>
                  <Icon type="external" size="s" weight="normal" />
                  <Icon type="external" size="s" weight="normal" />
                </span>
              </span>
            </a>
          ) : null}
        </div>

        {/* CTA — black + white */}
        <div className={cn('ctas')}>
          <ProductRequestModal productTitle={title} />

          {compareUrl ? (
            <Button
              variant="tertiary"
              size="small"
              label={compareLabel}
              icon="right-small"
              iconAlwaysVisible
              href={compareUrl}
            />
          ) : null}
        </div>
      </nav>
    </div>
  )
}
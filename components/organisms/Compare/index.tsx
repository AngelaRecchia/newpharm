'use client'

import { Suspense, useCallback, useMemo } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Asset from '@/components/atoms/Asset'
import Button from '@/components/atoms/Button'
import Icon from '@/components/atoms/Icon'
import SmartLink from '@/components/atoms/SmartLink'
import RichText from '@/components/organisms/RichText'
import CompareProductSelect from '@/components/organisms/Compare/CompareProductSelect'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import {
  getCompareOptionsForSlot,
  hasCompareResources,
  hasCompareRichtext,
  hasCompareTargetPests,
  mapProductStoriesToCompare,
  type CompareProductView,
} from '@/lib/products/mapProductToCompare'
import { useCompareProductsUrl } from '@/lib/products/useCompareProductsUrl'
import type { CompareStoryblok } from '@/types/storyblok'
import TargetPests from '@/components/molecules/TargetPests'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type CompareSection = {
  id: string
  labelKey: string
  hasContent: (product: CompareProductView) => boolean
  render: (product: CompareProductView) => React.ReactNode
}

type SlotIndex = 0 | 1

function getSelectOptions(
  slotIndex: SlotIndex,
  selected: [CompareProductView | null, CompareProductView | null],
  allProducts: CompareProductView[],
) {
  const product = selected[slotIndex]
  const pool = getCompareOptionsForSlot(allProducts, slotIndex, selected)
  const options = pool.map((entry) => ({
    value: entry.uuid,
    label: entry.title,
  }))

  if (product && !options.some((option) => option.value === product.uuid)) {
    options.unshift({ value: product.uuid, label: product.title })
  }

  return options
}

function CompareInner({ blok }: { blok?: CompareStoryblok }) {
  const t = useTranslations('')
  const { slots, setSlots } = useCompareProductsUrl()

  const allProducts = useMemo(
    () => mapProductStoriesToCompare(blok?.resolved_items ?? []),
    [blok?.resolved_items],
  )

  const productsByUuid = useMemo(
    () => new Map(allProducts.map((product) => [product.uuid, product])),
    [allProducts],
  )

  const selected: [CompareProductView | null, CompareProductView | null] = [
    slots[0] ? productsByUuid.get(slots[0]) ?? null : null,
    slots[1] ? productsByUuid.get(slots[1]) ?? null : null,
  ]

  const selectPlaceholder = t('compare_select_product')
  const discoverMoreLabel = t('discover_more')
  const technicalLabel = t('product_technical_sheet')
  const safetyLabel = t('product_safety_sheet')

  const handleTechnicalSheetDownload = useCallback(async (_productUuid: string) => {
    // TODO: fetch scheda tecnica
  }, [])

  const handleSlotChange = (slotIndex: SlotIndex, uuid: string | null) => {
    setSlots((prev) => {
      const next: [string | null, string | null] = [...prev]
      next[slotIndex] = uuid

      if (uuid) {
        const newProduct = productsByUuid.get(uuid)
        const otherIndex = (1 - slotIndex) as SlotIndex
        const otherUuid = next[otherIndex]

        if (otherUuid && newProduct?.category) {
          const otherProduct = productsByUuid.get(otherUuid)
          if (otherProduct && otherProduct.category !== newProduct.category) {
            next[otherIndex] = null
          }
        }
      }

      return next
    })
  }

  const sections: CompareSection[] = useMemo(
    () => [
      {
        id: 'application',
        labelKey: 'product_application-areas',
        hasContent: (product) => hasCompareRichtext(product.applicationAreasText),
        render: (product) => (
          <RichText content={product.applicationAreasText} raw />
        ),
      },
      {
        id: 'composition',
        labelKey: 'product_composition',
        hasContent: (product) => hasCompareRichtext(product.composition),
        render: (product) => <RichText content={product.composition} raw />,
      },
      {
        id: 'pests',
        labelKey: 'product_target-pests',
        hasContent: (product) => hasCompareTargetPests(product),
        render: (product) => <TargetPests items={product.targetPests} />,
      },
      {
        id: 'dosage',
        labelKey: 'product_dosage',
        hasContent: (product) => hasCompareRichtext(product.dosage),
        render: (product) => <RichText content={product.dosage} raw />,
      },
      {
        id: 'units',
        labelKey: 'product_units-per-carton',
        hasContent: (product) => hasCompareRichtext(product.unitsPerCarton),
        render: (product) => <RichText content={product.unitsPerCarton} raw />,
      },
      {
        id: 'download',
        labelKey: 'product_download',
        hasContent: (product) => hasCompareResources(product),
        render: (product) => (
          <div className={cn('downloadLinks')}>
            {product.resources.map((resource) => (
              <SmartLink
                key={resource._uid}
                link={resource.link}
                className={cn('downloadLink')}
              >
                <span className={cn('dot')} aria-hidden />
                <span className={cn('downloadLinkLabel')}>{resource.label}</span>
              </SmartLink>
            ))}
          </div>
        ),
      },
    ],
    [t],
  )

  const visibleSections = sections.filter((section) =>
    selected.some((product) => product && section.hasContent(product)),
  )

  const showFooter = selected.some((product) => !!product)

  const renderCell = (
    slotIndex: SlotIndex,
    className: string,
    content: React.ReactNode,
    cellKey: string,
  ) => (
    <div
      key={cellKey}
      className={cn('cell', slotIndex === 0 ? 'cell--left' : 'cell--right', className)}
    >
      {content}
    </div>
  )

  const renderEmptySlot = (slotIndex: SlotIndex, rowKey: string) =>
    renderCell(slotIndex, 'cell--emptySlot', null, `${rowKey}-${slotIndex}`)

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok?.anchor_id)}
      {...storyblokEditable(blok as any)}
    >
      <div className={cn('scroll')} data-lenis-prevent>
        <div className={cn('board')}>
          {([0, 1] as const).map((slotIndex) =>
            renderCell(
              slotIndex,
              'cell--select',
              <CompareProductSelect
                value={slots[slotIndex]}
                options={getSelectOptions(slotIndex, selected, allProducts)}
                placeholder={selectPlaceholder}
                onChange={(uuid) => handleSlotChange(slotIndex, uuid)}
              />,
              `select-${slotIndex}`,
            ),
          )}

          {([0, 1] as const).map((slotIndex) => {
            const product = selected[slotIndex]
            return renderCell(
              slotIndex,
              'cell--image',
              !product ? (
                <div className={cn('imageFrame', 'empty')} aria-hidden>
                  <span className={cn('placeholderIcon')}>
                    <Icon type="more" size="l" weight="bold" />
                  </span>
                </div>
              ) : (
                <div className={cn('imageFrame', 'filled')}>
                  {product.image ? (
                    <div className={cn('imageInner')}>
                      <Asset asset={product.image} mode="fit" />
                    </div>
                  ) : null}
                </div>
              ),
              `image-${slotIndex}`,
            )
          })}

          {([0, 1] as const).map((slotIndex) => {
            const product = selected[slotIndex]
            return product
              ? renderCell(
                  slotIndex,
                  'cell--intro',
                  <div className={cn('intro')}>
                    {product.shortDescription ? (
                      <p className={cn('description')}>{product.shortDescription}</p>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="small"
                      label={discoverMoreLabel}
                      href={product.href}
                    />
                  </div>,
                  `intro-${slotIndex}`,
                )
              : renderEmptySlot(slotIndex, 'intro')
          })}

          {visibleSections.map((section) => (
            <div key={section.id} className={cn('rowGroup')}>
              {([0, 1] as const).map((slotIndex) => {
                const product = selected[slotIndex]
                if (!product) {
                  return renderEmptySlot(slotIndex, `section-${section.id}`)
                }

                return renderCell(
                  slotIndex,
                  'cell--section',
                  <>
                    <h3 className={cn('sectionLabel')}>{t(section.labelKey)}</h3>
                    <div className={cn('sectionContent')}>
                      {section.hasContent(product) ? section.render(product) : null}
                    </div>
                  </>,
                  `${section.id}-${slotIndex}`,
                )
              })}
            </div>
          ))}

          {showFooter ? (
            <div className={cn('rowGroup')}>
              {([0, 1] as const).map((slotIndex) => {
                const product = selected[slotIndex]
                if (!product) {
                  return renderEmptySlot(slotIndex, 'footer')
                }

                return renderCell(
                  slotIndex,
                  'cell--footer',
                  <div className={cn('footer')}>
                    <div className={cn('sheetLinks')}>
                      <button
                        type="button"
                        className={cn('sheetLink')}
                        onClick={() => void handleTechnicalSheetDownload(product.uuid)}
                      >
                        <span className={cn('sheetLinkLabel')}>{technicalLabel}</span>
                        <Icon type="external" size="s" weight="normal" />
                      </button>
                      {product.safetySheetHref ? (
                        <SmartLink
                          href={product.safetySheetHref}
                          className={cn('sheetLink')}
                          target="_blank"
                        >
                          <span className={cn('sheetLinkLabel')}>{safetyLabel}</span>
                          <Icon type="external" size="s" weight="normal" />
                        </SmartLink>
                      ) : null}
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      label={discoverMoreLabel}
                      href={product.href}
                    />
                  </div>,
                  `footer-${slotIndex}`,
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default function Compare({ blok }: { blok?: CompareStoryblok }) {
  return (
    <Suspense fallback={null}>
      <CompareInner blok={blok} />
    </Suspense>
  )
}

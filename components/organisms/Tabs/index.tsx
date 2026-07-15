'use client'

import { useCallback, useMemo, useState } from 'react'
import classNames from 'classnames/bind'
import { AnimatePresence, motion } from 'motion/react'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import AccordionItem from '@/components/atoms/AccordionItem'
import RichText from '@/components/organisms/RichText'
import { isEmpty } from '@/lib/api/utils/links'
import { TabsStoryblok } from '@/types/storyblok'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

function getTabItemAsset(item: unknown) {
  if (!item || typeof item !== 'object') return null

  const record = item as Record<string, unknown>
  const rawAsset = record.asset ?? record.image

  if (Array.isArray(rawAsset) && rawAsset.length > 0) {
    return rawAsset[0]
  }

  if (rawAsset && typeof rawAsset === 'object' && 'filename' in rawAsset) {
    return rawAsset
  }

  return null
}

const Tabs = ({ blok }: { blok: TabsStoryblok }) => {
  const { title, asset, items } = blok
  const [previewIndex, setPreviewIndex] = useState(0)

  const hasTitle = !isEmpty(title)
  const hasAsset = asset && asset.length > 0
  const tabItems = items ?? []

  const previewItem = useMemo(() => {
    const safe = Math.min(previewIndex, Math.max(0, tabItems.length - 1))
    return tabItems[safe] ?? tabItems[0]
  }, [tabItems, previewIndex])

  const coverAsset = useMemo(() => {
    const itemAsset = previewItem ? getTabItemAsset(previewItem) : null
    if (itemAsset) return itemAsset
    if (hasAsset) return asset
    return null
  }, [previewItem, hasAsset, asset])

  const showPreview = useCallback(
    (index: number) => {
      if (index >= 0 && index < tabItems.length) setPreviewIndex(index)
    },
    [tabItems.length]
  )

  const renderPreview = (variant: 'sticky' | 'mobile') => {
    if (!coverAsset) return null

    const previewKey = `${(previewItem as { _uid?: string })?._uid ?? 'tab'}-${previewIndex}-${variant}`

    return (
      <div className={cn('preview', variant)} aria-hidden={true}>
        <div className={cn('previewInner')}>
          <div className={cn('previewFrame')}>
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={previewKey}
                className={cn('previewMotion')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <Asset
                  asset={coverAsset}
                  size="l"
                  mode="fit"
                  className={cn('previewAsset')}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className={cn('wrapper')} id={getStoryblokAnchorId(blok.anchor_id)} {...storyblokEditable(blok as any)}>
      <div className={cn('container')}>
        <div className={cn('layout')}>
          {renderPreview('sticky')}

          <div className={cn('main')}>
            {hasTitle && <h2 className={cn('title')}>{title}</h2>}

            {renderPreview('mobile')}

            {tabItems.length > 0 && (
              <div className={cn('items')}>
                {tabItems.map((item: any, index: number) => (
                  <div
                    key={item._uid}
                    className={cn('item')}
                    onMouseEnter={() => showPreview(index)}
                    onFocusCapture={() => showPreview(index)}
                  >
                    <AccordionItem
                      label={item.title || ''}
                      variant="secondary"
                      bgColor="white"
                      defaultOpen={index === 0}
                    >
                      <RichText content={item.text} raw />
                    </AccordionItem>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Tabs

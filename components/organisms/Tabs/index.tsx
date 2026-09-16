import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import AccordionItem from '@/components/atoms/AccordionItem'
import RichText from '@/components/organisms/RichText'
import { isEmpty } from '@/lib/api/utils/links'
import { TabsStoryblok } from '@/types/storyblok'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const Tabs = ({ blok }: { blok: TabsStoryblok }) => {
  const { title, asset, items } = blok

  const hasTitle = !isEmpty(title)
  const coverAsset = asset && asset.length > 0 ? asset : null
  const tabItems = items ?? []

  const renderPreview = (variant: 'sticky' | 'mobile') => {
    if (!coverAsset) return null

    return (
      <div className={cn('preview', variant)} aria-hidden={true}>
        <div className={cn('previewInner')}>
          <div className={cn('previewFrame')}>
            <Asset
              asset={coverAsset}
              size="l"
              mode="fit"
              className={cn('previewAsset')}
            />
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
                  <div key={item._uid ?? `tab-${index}`} className={cn('item')}>
                    <AccordionItem
                      label={item.title || ''}
                      variant="secondary"
                      bgColor="white"
                      defaultOpen={index === 0}
                    >
                      <RichText content={item.text} raw enableGlossary />
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

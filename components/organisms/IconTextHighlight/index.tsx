import classNames from 'classnames/bind'
import type { CSSProperties } from 'react'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import { getAssetSrc } from '@/lib/assets/getAssetSrc'
import { isEmpty } from '@/lib/api/utils/links'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'
import { Icon_text_highlightStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const IconTextHighlight = ({ blok }: { blok: Icon_text_highlightStoryblok }) => {
  const { title, description, items } = blok
  const cols = Math.min(items?.length || 1, 4)
  const hasTitle = !isEmpty(title)
  const hasDescription = !isEmpty(description)

  return (
    <section className={cn('wrapper')} id={getStoryblokAnchorId(blok.anchor_id)} {...storyblokEditable(blok as any)}>
      <div className={cn('container')}>
        {(hasTitle || hasDescription) && (
          <div className={cn('head')}>
            {hasTitle && <h2 className={cn('title')}>{title}</h2>}
            {hasDescription && <p className={cn('description')}>{description}</p>}
          </div>
        )}

        <div className={cn('items')} style={{ '--cols': cols } as CSSProperties}>
          {items?.map((item, index) => (
            <div key={item._uid ?? `icon-text-${index}`} className={cn('item')}>
              {getAssetSrc(item.image as any) && (
                <div className={cn('item-image')}>
                  <Asset asset={item.image} size='s' />
                </div>
              )}
              <h4 className={cn('item-title')}>{item.title}</h4>
              <p className={cn('item-description')}>{item.description}</p>
            </div>

          ))}
        </div>
      </div>
    </section>
  )
}

export default IconTextHighlight

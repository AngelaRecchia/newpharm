import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { Icon_text_highlightStoryblok } from '@/types/storyblok'
import Asset from '@/components/atoms/Asset'

const cn = classNames.bind(styles)

const IconTextHighlight = ({ blok }: { blok: Icon_text_highlightStoryblok }) => {
  const { title, description, items } = blok
  return (
    <div className={cn('wrapper')}>
      <div className={cn('container')}>
        <div className={cn('head')}>
          <h3 className={cn('title')}>{title}</h3>
          <p className={cn('description')}>{description}</p>
        </div>

        <div className={cn('items')}>
          {items?.map((item) => (
            <div key={item._uid} className={cn('item')}>
              <div className={cn('item-image')}>
                <Asset asset={item.image} size='s' />
              </div>
              <h4 className={cn('item-title')}>{item.title}</h4>
              <p className={cn('item-description')}>{item.description}</p>
            </div>

          ))}
        </div>
      </div>
    </div>
  )
}

export default IconTextHighlight

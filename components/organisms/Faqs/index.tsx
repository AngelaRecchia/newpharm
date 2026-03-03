import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { FaqsStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'
import AccordionItem from '@/components/atoms/AccordionItem'
import RichText from '@/components/organisms/RichText'

const cn = classNames.bind(styles)

const Faqs = ({ blok }: { blok: FaqsStoryblok }) => {
  const { title, description, items } = blok

  return (
    <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>

      <div className={cn('container')}>
        {(title || description) && (
          <div className={cn('head')}>
            {title && <h2 className={cn('title')}>{title}</h2>}
            {description && <p className={cn('description')}>{description}</p>}
          </div>
        )}

        {items && items.length > 0 && (
          <div className={cn('items')}>
            {items.map((item: any) => (
              <AccordionItem key={item._uid} label={item.title || ''} variant="secondary">
                <RichText content={item.text} raw />
              </AccordionItem>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Faqs

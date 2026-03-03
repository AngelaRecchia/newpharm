'use client'

import { useState } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { TabsStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'
import Asset from '@/components/atoms/Asset'
import AccordionItem from '@/components/atoms/AccordionItem'
import RichText from '@/components/organisms/RichText'

const cn = classNames.bind(styles)

const Tabs = ({ blok }: { blok: TabsStoryblok }) => {
  const { title, asset, items } = blok
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className={cn('wrapper')} {...storyblokEditable(blok as any)}>
      {title && <h2 className={cn('title')}>{title}</h2>}

      <div className={cn('content')}>
        {asset && asset.length > 0 && (
          <div className={cn('asset')}>
            <Asset asset={asset} size="m" mode="fit" />
          </div>
        )}

        {items && items.length > 0 && (
          <div className={cn('items')}>
            {items.map((item: any, index: number) => (
              <AccordionItem
                key={item._uid}
                label={item.title || ''}
                variant="secondary"
                defaultOpen={index === 0}
              >
                <RichText content={item.text} raw />
              </AccordionItem>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Tabs

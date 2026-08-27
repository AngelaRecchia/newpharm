'use client'

import { storyblokEditable } from '@storyblok/react'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import RichText from '@/components/organisms/RichText'
import type { Article_bodyStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const ArticleBody = ({ blok }: { blok?: Article_bodyStoryblok }) => {
  if (!blok) return null

  return (
    <div className={cn('article')} {...storyblokEditable(blok as never)}>
      <RichText content={blok.article} enableGlossary />
      {blok.show_copy_button ? (
        <div className={cn('share')}>
          <Button
            icon="url"
            pageAction="copy"
            variant="secondary"
            size="small"
          />
        </div>
      ) : null}
    </div>
  )
}

export default ArticleBody

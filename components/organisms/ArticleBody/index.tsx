'use client'

import { useTranslations } from 'next-intl'
import { storyblokEditable } from '@storyblok/react'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import RichText from '@/components/organisms/RichText'
import { useCopyPageLink } from '@/lib/use-copy-page-link'
import type { Article_bodyStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const CopyLinkButton = () => {
  const t = useTranslations('')
  const { copied, copyPageLink } = useCopyPageLink()

  return (
    <Button
      icon="url"
      label={copied ? t('link_copied') : t('copy_link')}
      variant="secondary"
      size="small"
      onClick={copyPageLink}
      aria-label={t('copy_link')}
    />
  )
}

const ArticleBody = ({ blok }: { blok?: Article_bodyStoryblok }) => {
  if (!blok) return null

  return (
    <div className={cn('article')} {...storyblokEditable(blok as never)}>
      <RichText content={blok.article} enableGlossary />
      {blok.show_copy_button ? (
        <div className={cn('share')}>
          <CopyLinkButton />
        </div>
      ) : null}
    </div>
  )
}

export default ArticleBody

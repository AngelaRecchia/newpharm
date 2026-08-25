'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import RichText from '@/components/organisms/RichText'
import type { Article_bodyStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const ArticleBody = ({ blok }: { blok?: Article_bodyStoryblok }) => {
  const t = useTranslations('')
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  const copyPageLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [])

  if (!blok) return null

  return (
    <div className={cn('article')} {...storyblokEditable(blok as never)}>
      <RichText content={blok.article} />
      <div className={cn('share')}>
        <Button
          icon="url"
          label={copied ? t('link_copied') : t('copy_link')}
          variant="secondary"
          size="small"
          onClick={copyPageLink}
          aria-label={t('copy_link')}
        />
      </div>
    </div>
  )
}

export default ArticleBody

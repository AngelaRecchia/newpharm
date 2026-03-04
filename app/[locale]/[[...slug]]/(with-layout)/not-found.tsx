'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import classNames from 'classnames/bind'
import styles from './not-found.module.scss'
import Button from '@/components/atoms/Button'

const cn = classNames.bind(styles)

/**
 * Custom 404 Not Found page
 * 
 * This page is shown when:
 * - A story doesn't exist in the current locale
 * - User navigates to an invalid route
 * - notFound() is called in any page/layout
 */
export default function NotFound() {
  const t = useTranslations('')

  return (
    <div className={cn('container')}>
      <div className={cn('content')}>
        <h1 className={cn('title')}>404</h1>
        <Button variant='tertiary' href="/" label={t('go_to_homepage')} />
      </div>
    </div>
  )
}

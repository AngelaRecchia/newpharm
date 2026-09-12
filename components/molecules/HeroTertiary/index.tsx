'use client'

import classNames from 'classnames/bind'
import GlossaryText from '@/components/atoms/GlossaryText'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type HeroTertiaryProps = {
  title?: string | null
  subtitle?: string | null
  as?: 'h1' | 'h2'
  className?: string
}

export default function HeroTertiary({
  title,
  subtitle,
  as: Heading = 'h2',
  className,
}: HeroTertiaryProps) {
  if (!title && !subtitle) return null

  return (
    <header className={cn('wrapper', className)}>
      {title ? <Heading className={cn('title')}>{title}</Heading> : null}
      {subtitle ? (
        <p className={cn('subtitle')}>
          <GlossaryText text={subtitle} />
        </p>
      ) : null}
    </header>
  )
}

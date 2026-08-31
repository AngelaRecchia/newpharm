import classNames from 'classnames/bind'
import SmartLink from '@/components/atoms/SmartLink'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type CardJobProps = {
  title: string
  area?: string
  esperienza?: string
  href: string
}

export default function CardJob({ title, area, esperienza, href }: CardJobProps) {
  const hrefValue = href.startsWith('/') ? href : `/${href}`

  return (
    <article className={cn('wrapper')}>
      <div className={cn('main')}>
        <h6 className={cn('title')}>{title}</h6>
        <div className={cn('meta')}>
          {area ? (
            <div className={cn('field')}>
              <span className={cn('label')}>Area</span>
              <span className={cn('value')}>{area}</span>
            </div>
          ) : null}
          {esperienza ? (
            <div className={cn('field')}>
              <span className={cn('label')}>Esperienza</span>
              <span className={cn('value')}>{esperienza}</span>
            </div>
          ) : null}
        </div>
      </div>
      <SmartLink href={hrefValue} className={cn('link')}>
        Scopri di più
      </SmartLink>
    </article>
  )
}

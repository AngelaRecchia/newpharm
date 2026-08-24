import classNames from 'classnames/bind'
import Asset from '@/components/atoms/Asset'
import type { TargetPestView } from '@/lib/products/mapTargetPests'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type TargetPestsProps = {
  items: TargetPestView[]
}

export default function TargetPests({ items }: TargetPestsProps) {
  if (items.length === 0) return null

  return (
    <ul className={cn('list')}>
      {items.map((item) => (
        <li key={item.uid} className={cn('row')}>
          {item.image ? (
            <span className={cn('icon')}>
              <Asset asset={item.image} size="s" mode="fit" />
            </span>
          ) : null}
          <p className={cn('copy')}>
            <span className={cn('title')}>{item.title}</span>
            {item.text ? (
              <>
                {' '}
                <span className={cn('text')}>{item.text}</span>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  )
}

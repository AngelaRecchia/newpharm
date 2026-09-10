import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import Icon from '@/components/atoms/Icon'
import { PEST_FAMILY_ICON } from '@/lib/insects/families'
import type { TargetPestView } from '@/lib/products/mapTargetPests'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type TargetPestsProps = {
  items: TargetPestView[]
}

export default function TargetPests({ items }: TargetPestsProps) {
  const t = useTranslations('')

  if (items.length === 0) return null

  const groupedItems = new Map<TargetPestView['family'], TargetPestView[]>()

  for (const item of items) {
    const group = groupedItems.get(item.family) ?? []
    group.push(item)
    groupedItems.set(item.family, group)
  }

  return (
    <ul className={cn('list')}>
      {[...groupedItems.entries()].map(([family, familyItems]) => (
        <li key={family ?? 'unknown'} className={cn('row')}>
          {family ? (
            <span className={cn('icon')}>
              <Icon type={PEST_FAMILY_ICON[family]} size="l" />
            </span>
          ) : null}
          <p className={cn('copy')}>
            {family ? <strong className={cn('title')}>{t(family)}</strong> : null}
            <span className={cn('text')}>
              {' ('}
              {familyItems.map((item) => item.title).join(', ')}
              {')'}
            </span>
          </p>
        </li>
      ))}
    </ul>
  )
}

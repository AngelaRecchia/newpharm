import classNames from 'classnames/bind'
import type { TargetPestFamilyView } from '@/lib/insects/family'
import type { TargetPestView } from '@/lib/products/mapTargetPests'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

type TargetPestsProps = {
  items: TargetPestView[]
}

type FamilyGroup = {
  family: TargetPestFamilyView | null
  items: TargetPestView[]
}

export default function TargetPests({ items }: TargetPestsProps) {
  if (items.length === 0) return null

  const groupedItems = new Map<string | null, FamilyGroup>()

  for (const item of items) {
    const key = item.family?.uid ?? null
    const group = groupedItems.get(key) ?? { family: item.family, items: [] }
    group.items.push(item)
    groupedItems.set(key, group)
  }

  return (
    <ul className={cn('list')}>
      {[...groupedItems.values()].map(({ family, items: familyItems }) => (
        <li key={family?.uid ?? 'unknown'} className={cn('row')}>
          {family?.iconUrl ? (
            <span className={cn('icon')}>
              <span
                className={cn('mask')}
                aria-hidden
                style={{
                  WebkitMaskImage: `url("${family.iconUrl}")`,
                  maskImage: `url("${family.iconUrl}")`,
                }}
              />
            </span>
          ) : null}
          <p className={cn('copy')}>
            {family ? <strong className={cn('title')}>{family.title}</strong> : null}
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

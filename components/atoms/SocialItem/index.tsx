'use client'

import Link from 'next/link'
import Icon from '../Icon'
import { icons } from '../Icon/icons'
import { getLinkUrl } from '@/lib/api/utils/links'
import { Social_itemStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

type IconKey = keyof typeof icons


interface SocialItemProps {
  item: Social_itemStoryblok
}

export default function SocialItem({ item }: SocialItemProps) {

  const href = getLinkUrl(item.url as Parameters<typeof getLinkUrl>[0]) || '#'



  return (
    <Link
      href={href}
      className={styles.socialItem}
      target={'_blank'}
      rel={'noopener noreferrer'}
      aria-label={`Social link ${item.type}`}
    >
      <Icon type={item.type} size="m" />
    </Link>
  )
}

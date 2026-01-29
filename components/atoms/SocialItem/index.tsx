'use client'

import SmartLink from '../SmartLink'
import Icon from '../Icon'
import { icons } from '../Icon/icons'
import { Social_itemStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

type IconKey = keyof typeof icons


interface SocialItemProps {
  item: Social_itemStoryblok
}

export default function SocialItem({ item }: SocialItemProps) {
  return (
    <SmartLink
      link={item.url}
      className={styles.socialItem}
      target={'_blank'}
      rel={'noopener noreferrer'}
      aria-label={`Social link ${item.type}`}
    >
      <Icon type={item.type} size="m" />
    </SmartLink>
  )
}

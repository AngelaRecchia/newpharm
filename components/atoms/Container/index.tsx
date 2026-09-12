import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type ContainerProps = {
  children: ReactNode
  className?: string
  size?: 'lg' | 'md'
  flushBlock?: boolean
  as?: ElementType
} & HTMLAttributes<HTMLElement>

export default function Container({
  children,
  className,
  size = 'lg',
  flushBlock = false,
  as: Tag = 'div',
  ...rest
}: ContainerProps) {
  return (
    <Tag className={cn('wrapper', size, { flushBlock }, className)} {...rest}>
      {children}
    </Tag>
  )
}

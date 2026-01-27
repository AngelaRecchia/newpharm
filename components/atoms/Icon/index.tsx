import React from 'react'
import classNames from 'classnames'
import { icons } from './icons'
import styles from './index.module.scss'

type IconSize = 'xs' | 's' | 'm' | 'l'
type LogoVariant = 'white-red' | 'white-white' | 'primary-primary' | 'black-red' | 'black-black' | 'primary-red'

/** Props we pass when cloning icon elements (SVG). Keeps cloneElement type-safe. */
type IconCloneProps = {
  width?: number
  height?: number
  className?: string
}

const sizeMap: Record<IconSize, number> = {
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
}

const logoVariantClasses: Record<LogoVariant, string> = {
  'white-red': styles.logoVariantWhiteRed,
  'white-white': styles.logoVariantWhiteWhite,
  'primary-primary': styles.logoVariantPrimaryPrimary,
  'black-red': styles.logoVariantBlackRed,
  'black-black': styles.logoVariantBlackBlack,
  'primary-red': styles.logoVariantPrimaryRed,
}

interface IconProps {
  type: keyof typeof icons
  size?: IconSize
  variant?: LogoVariant
  className?: string
}

const Icon = ({ type, size = 'l', variant, className = '' }: IconProps) => {
  const icon = icons[type]

  if (!icon) return <></>

  // Il logo mantiene le sue dimensioni originali e supporta varianti
  if (type === 'logo') {
    const variantClass = variant ? logoVariantClasses[variant] : ''
    const combinedClassName = classNames(className, variantClass)

    return React.cloneElement(
      icon as React.ReactElement<IconCloneProps>,
      { className: combinedClassName }
    )
  }

  const sizeValue = sizeMap[size]

  return React.cloneElement(
    icon as React.ReactElement<IconCloneProps>,
    { width: sizeValue, height: sizeValue, className }
  )
}

export default Icon
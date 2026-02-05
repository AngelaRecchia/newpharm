import React from 'react'
import classNames from 'classnames'
import { icons } from './icons'
import styles from './index.module.scss'

type IconSize = 'xs' | 's' | 'm' | 'ml' | 'l'
type LogoVariant = 'white-red' | 'white-white' | 'primary-primary' | 'black-red' | 'black-black' | 'primary-red'

/** Props we pass when cloning icon elements (SVG). Keeps cloneElement type-safe. */
type IconCloneProps = {
  width?: number
  height?: number
  className?: string
  strokeWidth?: number | string
}

const sizeMap: Record<IconSize, number> = {
  xs: 8,
  s: 12,
  m: 16,
  ml: 20,
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
  weight?: number | 'normal' | 'bold'
}

// Helper per clonare ricorsivamente i children e applicare strokeWidth
const cloneChildrenWithStrokeWidth = (
  children: React.ReactNode,
  strokeWidth: number | string
): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child

    // Elementi SVG che possono avere stroke
    const strokeElements = ['path', 'line', 'circle', 'rect', 'polyline', 'polygon', 'ellipse']
    const elementType = (child.type as string)?.toLowerCase()

    if (strokeElements.includes(elementType)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        ...child.props,
        strokeWidth,
      })
    }

    // Se ha children, clona ricorsivamente
    if (child.props?.children) {
      return React.cloneElement(child as React.ReactElement<any>, {
        ...child.props,
        children: cloneChildrenWithStrokeWidth(child.props.children, strokeWidth),
      })
    }

    return child
  })
}

const Icon = ({ type, size = 'l', variant, className = '', weight = 'bold' }: IconProps) => {
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

  // Calcola strokeWidth basato su weight
  let strokeWidth: number | string | undefined
  if (weight !== undefined) {
    if (typeof weight === 'number') {
      strokeWidth = weight
    } else if (weight === 'normal') {
      strokeWidth = 1
    } else if (weight === 'bold') {
      strokeWidth = 1.5
    }
  }

  // Clona l'icona e applica strokeWidth ai children
  const clonedIcon = React.cloneElement(
    icon as React.ReactElement<any>,
    {
      ...icon.props,
      width: sizeValue,
      height: sizeValue,
      'data-size': size,
      className: classNames(icon.props?.className, className),
    }
  )

  // Se strokeWidth è definito, applicalo ai children
  if (strokeWidth !== undefined && clonedIcon.props.children) {
    return React.cloneElement(clonedIcon as React.ReactElement<any>, {
      children: cloneChildrenWithStrokeWidth(clonedIcon.props.children, strokeWidth),
    })
  }

  return clonedIcon
}

export default Icon
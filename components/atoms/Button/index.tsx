import { forwardRef } from 'react'
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { storyblokEditable } from '@storyblok/react'
import { LinkStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles);

import { icons } from '../Icon/icons'
import Icon from '../Icon'
import SmartLink from '../SmartLink'
import { StoryblokLink } from '@/lib/api/utils/links'

export interface ButtonProps {
    icon?: keyof typeof icons
    label?: string
    onClick?: () => void
    className?: string
    href?: string
    target?: string
    link?: StoryblokLink & { anchor?: string } | null
    variant?: 'primary' | 'secondary' | 'tertiary'
    size?: 'small' | 'medium',
    weight?: 'normal' | 'bold'
    animated?: boolean
    inert?: boolean
    'aria-label'?: string
    /** Blok Storyblok completo (opzionale, per storyblokEditable) */
    blok?: LinkStoryblok
}
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ icon = 'right-small', label, onClick, className, href, target, link, variant = 'primary', size = 'medium', weight = 'bold', animated = false, inert = false, 'aria-label': ariaLabel, blok, ...props }, ref) => {
    // Se blok è presente, applica storyblokEditable
    const editableProps = blok ? storyblokEditable(blok as any) : {}

    const hasLabel = label && label.length > 0
    const hasIcon = icon && icon.length > 0 && icons[icon]
    const onlyIcon = hasIcon && !hasLabel

    const linkTarget = link?.linktype === 'url' || link?.linktype === 'external' ? target || '_blank' : target

    // Rileva se l'icona è una freccia sinistra (per animazione inversa)
    const isLeftIcon = icon === 'chevron-left'

    const buttonClasses = cn('button', {
        buttonPrimary: variant === 'primary',
        buttonSecondary: variant === 'secondary',
        buttonTertiary: variant === 'tertiary',
        buttonIconOnly: onlyIcon,
        buttonWithLabel: hasLabel,
        buttonWithIcon: hasLabel && hasIcon,
        buttonSizeSmall: size === 'small',
        buttonSizeMedium: size === 'medium',
        animated: animated,
        'button-left': animated && isLeftIcon, // Classe per animazione verso sinistra
    }, className)

    const children = (
        <>
            {hasLabel && <span>{label}</span>}
            {onlyIcon && <Icon type={icon} size='m' weight={weight} />}
            {hasLabel && hasIcon && <div className={cn('buttonIcon')}><Icon type={icon} size='s' weight={weight} /></div>}
        </>
    )

    // Se inert è true, renderizza come div (solo visuale, non cliccabile)
    if (inert) {
        return (
            <div className={buttonClasses} aria-label={ariaLabel} {...editableProps} {...props}>
                {children}
            </div>
        )
    }

    // Renderizza come SmartLink se c'è un link o href, altrimenti come button
    if (link || href) {
        return (
            <SmartLink link={link} href={href} target={linkTarget} className={buttonClasses} aria-label={ariaLabel} {...editableProps} {...props}>
                {children}
            </SmartLink>
        )
    }

    return (
        <button ref={ref} onClick={onClick} className={buttonClasses} aria-label={ariaLabel} {...editableProps} {...props}>
            {children}
        </button>
    )
})

export default Button

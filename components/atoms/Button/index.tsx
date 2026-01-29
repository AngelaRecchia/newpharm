import classNames from 'classnames/bind';
import styles from './index.module.scss';

const cn = classNames.bind(styles);

import { icons } from '../Icon/icons'
import Icon from '../Icon'
import SmartLink from '../SmartLink'
import { StoryblokLink } from '@/lib/api/utils/links'

interface ButtonProps {
    icon?: keyof typeof icons
    label?: string
    onClick?: () => void
    className?: string
    href?: string
    target?: string
    link?: StoryblokLink & { anchor?: string } | null
    variant?: 'primary' | 'secondary' | 'tertiary'
    size?: 'small' | 'medium'
}
const Button = ({ icon = 'right-small', label, onClick, className, href, target, link, variant = 'primary', size = 'medium' }: ButtonProps) => {

    const hasLabel = label && label.length > 0
    const hasIcon = icon && icon.length > 0 && icons[icon]
    const onlyIcon = hasIcon && !hasLabel

    const linkTarget = link?.linktype === 'url' || link?.linktype === 'external' ? target || '_blank' : target

    const buttonClasses = cn('button', {
        buttonPrimary: variant === 'primary',
        buttonSecondary: variant === 'secondary',
        buttonTertiary: variant === 'tertiary',
        buttonIconOnly: onlyIcon,
        buttonWithLabel: hasLabel,
        buttonWithIcon: hasLabel && hasIcon,
        buttonSizeSmall: size === 'small',
        buttonSizeMedium: size === 'medium',
    }, className)

    const children = (
        <>
            {hasLabel && <span>{label}</span>}
            {onlyIcon && <Icon type={icon} size='m' />}
            {hasLabel && hasIcon && <div className={cn('buttonIcon')}><Icon type={icon} size='s' /></div>}
        </>
    )

    // Renderizza come SmartLink se c'è un link o href, altrimenti come button
    if (link || href) {
        return (
            <SmartLink link={link} href={href} target={linkTarget} className={buttonClasses}>
                {children}
            </SmartLink>
        )
    }

    return (
        <button onClick={onClick} className={buttonClasses}>
            {children}
        </button>
    )
}

export default Button
import classNames from 'classnames/bind';
import styles from './index.module.scss';

const cn = classNames.bind(styles);

import { icons } from '../Icon/icons'
import Icon from '../Icon'

interface ButtonProps {
    icon?: keyof typeof icons
    label?: string
    onClick?: () => void
    className?: string
    href?: string
    target?: string
    variant?: 'primary' | 'secondary' | 'tertiary'
    size?: 'small' | 'medium'
}
const Button = ({ icon = 'right-small', label, onClick, className, href, target, variant = 'primary', size = 'medium' }: ButtonProps) => {

    const hasLabel = label && label.length > 0
    const hasIcon = icon && icon.length > 0 && icons[icon]
    const onlyIcon = hasIcon && !hasLabel

    const Tag = href ? 'a' : 'button'
    const props = href ? { href, target } : { onClick }

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

    return (
        <Tag  {...props} className={buttonClasses}>

            {hasLabel && <span>{label}</span>}

            {onlyIcon && <Icon type={icon} size='m' />}
            {hasLabel && hasIcon && <div className={cn('buttonIcon')}><Icon type={icon} size='s' /></div>}

        </Tag>
    )
}

export default Button
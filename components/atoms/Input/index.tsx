'use client'

import React from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import Icon from '../Icon'
import { icons } from '../Icon/icons'
import Button from '../Button'

const cn = classNames.bind(styles)

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    skin?: 'default' | 'light'
    icon?: keyof typeof icons
    onIconClick?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({
        skin = 'default',
        icon = 'right-small',
        onIconClick,
        className,
        placeholder,
        ...props
    }, ref) => {
        const inputClasses = cn('input', {
            inputDefault: skin === 'default',
            inputLight: skin === 'light',
        }, className)

        const wrapperClasses = cn('inputWrapper', {
            inputWrapperDefault: skin === 'default',
            inputWrapperLight: skin === 'light',
        })

        return (
            <div className={wrapperClasses}>
                <input
                    ref={ref}
                    className={inputClasses}
                    placeholder={placeholder}
                    aria-label={props['aria-label'] || placeholder}
                    {...props}
                />
                <Button
                    icon={icon}
                    onClick={onIconClick}
                    variant={skin === 'default' ? 'secondary' : 'tertiary'}
                    size='small'
                />
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input

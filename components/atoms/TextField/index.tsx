'use client'

import { forwardRef, useId } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import Icon from '@/components/atoms/Icon'
import { icons } from '@/components/atoms/Icon/icons'
import Button from '@/components/atoms/Button'

const cn = classNames.bind(styles)

type SharedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id'
>

export type TextFieldFormProps = SharedInputProps & {
  variant?: 'form'
  label: React.ReactNode
  id?: string
}

export type TextFieldInlineProps = SharedInputProps & {
  variant: 'inline'
  skin?: 'default' | 'light'
  icon?: keyof typeof icons
  onIconClick?: () => void
}

export type TextFieldProps = TextFieldFormProps | TextFieldInlineProps

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (props, ref) => {
    const genId = useId()

    if (props.variant === 'inline') {
      const {
        variant: _v,
        skin = 'default',
        icon = 'right-small',
        onIconClick,
        className,
        placeholder,
        ...rest
      } = props

      const inputClasses = cn('inlineInput', {
        inlineInputDefault: skin === 'default',
        inlineInputLight: skin === 'light',
      }, className)

      const wrapperClasses = cn('inlineWrapper', {
        inlineWrapperDefault: skin === 'default',
        inlineWrapperLight: skin === 'light',
      })

      return (
        <div className={wrapperClasses}>
          <input
            ref={ref}
            className={inputClasses}
            placeholder={placeholder}
            aria-label={rest['aria-label'] || placeholder}
            {...rest}
          />
          <Button
            icon={icon}
            onClick={onIconClick}
            variant={skin === 'default' ? 'secondary' : 'tertiary'}
            size="small"
          />
        </div>
      )
    }

    const { label, id: idProp, className, variant: _v, ...inputProps } = props
    const id = idProp ?? genId

    return (
      <label className={cn('field', className)} htmlFor={id}>
        <span className={cn('label')}>{label}</span>
        <input ref={ref} id={id} className={cn('input')} {...inputProps} />
      </label>
    )
  }
)

TextField.displayName = 'TextField'

export default TextField

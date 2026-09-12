'use client'

import { forwardRef, useId } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface CheckboxFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'children' | 'id'
  > {
  children: React.ReactNode
  id?: string
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ children, id: idProp, className, ...inputProps }, ref) => {
    const genId = useId()
    const id = idProp ?? genId

    return (
      <label className={cn('root', className)} htmlFor={id}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn('input')}
          {...inputProps}
        />
        <span className={cn('text')}>{children}</span>
      </label>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'

export default CheckboxField

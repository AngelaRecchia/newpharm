'use client'

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import classNames from 'classnames/bind'
import Icon from '@/components/atoms/Icon'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface SelectOption {
  value: string
  label: string
}

export type SelectNativeProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'id'
> & {
  variant?: 'native'
  label: React.ReactNode
  options: SelectOption[]
  /** Prima opzione con `value=""` (testo tipo “Seleziona…”) */
  placeholder?: string
  id?: string
  error?: string
}

export type SelectMenuProps = {
  variant: 'menu'
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  openTo?: 'bottom' | 'top'
}

export type SelectProps = SelectNativeProps | SelectMenuProps

function SelectMenu({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  openTo = 'bottom',
}: SelectMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (options.length <= 2) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, options.length])

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  if (options.length <= 1) {
    return null
  }

  if (options.length <= 2) {
    const notSelectedOption = options.find((opt) => opt.value !== value)
    return (
      <button
        type="button"
        className={cn('menuTrigger', 'singleTrigger')}
        onClick={() => onChange?.(notSelectedOption?.value || '')}
      >
        {notSelectedOption?.label}
      </button>
    )
  }

  const selectedOption = options.find((opt) => opt.value === selectedValue)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    setIsOpen(false)
    onChange?.(optionValue)
  }

  return (
    <div className={cn('menuRoot', className)} ref={dropdownRef}>
      <button
        type="button"
        className={cn('menuTrigger', { menuTriggerOpen: isOpen })}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg
          className={cn('menuChevron', { menuChevronRotated: isOpen })}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          className={cn('menuPanel', { menuPanelTop: openTo === 'top' })}
          role="listbox"
        >
          <div className={cn('menuInner')}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn('menuOption', {
                  menuOptionSelected: option.value === selectedValue,
                })}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === selectedValue}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const SelectNative = forwardRef<
  HTMLSelectElement,
  Omit<SelectNativeProps, 'variant'>
>(
  (
    {
      label,
      options,
      placeholder,
      id: idProp,
      className,
      error,
      'aria-invalid': ariaInvalid,
      ...selectProps
    },
    ref
  ) => {
    const genId = useId()
    const id = idProp ?? genId
    const hasError = Boolean(error?.trim())
    const invalid =
      ariaInvalid !== undefined ? Boolean(ariaInvalid) : hasError

    const value = selectProps.value as string | undefined
    const showPlaceholder =
      Boolean(placeholder) && (value === '' || value === undefined)

    return (
      <div className={cn('nativeRoot', className)}>
        <label className={cn('nativeField')} htmlFor={id}>
          <span className={cn('nativeLabel')}>{label}</span>
          <div className={cn('selectWrap')}>
            <select
              ref={ref}
              id={id}
              className={cn('nativeSelect', {
                nativeSelectError: hasError,
                nativeSelectPlaceholder: showPlaceholder,
              })}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={hasError ? `${id}-error` : undefined}
              {...selectProps}
            >
              {placeholder ? (
                <option value="" disabled>
                  {placeholder}
                </option>
              ) : null}
              {options.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className={cn('selectChevron')} aria-hidden>
              <Icon type="chevron-down" size="s" weight="normal" />
            </span>
          </div>
        </label>
        {hasError ? (
          <div id={`${id}-error`} className={cn('errorRow')} role="alert">
            <span className={cn('errorIcon')} aria-hidden>
              <Icon type="cancel" size="s" weight="normal" />
            </span>
            <p className={cn('errorText')}>{error}</p>
          </div>
        ) : null}
      </div>
    )
  }
)

SelectNative.displayName = 'SelectNative'

const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  if (props.variant === 'menu') {
    return <SelectMenu {...props} />
  }
  const { variant: _v, ...nativeProps } = props
  return <SelectNative ref={ref} {...nativeProps} />
})

Select.displayName = 'Select'

export default Select

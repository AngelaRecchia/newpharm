'use client'

import { useState, useRef, useEffect } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface DropdownOption {
    value: string
    label: string
}

export interface DropdownProps {
    options: DropdownOption[]
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    className?: string
    openTo?: 'bottom' | 'top'
}

export default function Dropdown({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    openTo = 'bottom',
}: DropdownProps) {
    // Hooks devono essere chiamati sempre, non condizionalmente
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside (solo se dropdown è attivo)
    useEffect(() => {
        if (options.length <= 2) return // Skip se non è un dropdown completo

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

    // Update selected value when value prop changes
    useEffect(() => {
        setSelectedValue(value)
    }, [value])

    if (options.length <= 1) {
        return <></>
    }
    if (options.length <= 2) {
        const notSelectedOption = options.find((opt) => opt.value !== value)
        return <button className={cn('trigger', 'singleTrigger')} onClick={() => onChange?.(notSelectedOption?.value || '')}>
            {notSelectedOption?.label}
        </button>
    }

    // Find selected option
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
        <div className={cn('dropdown', className)} ref={dropdownRef}>
            <button
                type="button"
                className={cn('trigger', { open: isOpen })}
                onClick={handleToggle}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={cn('label')}>
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={cn('icon', { rotated: isOpen })}
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

            {isOpen && (
                <div className={cn('menu', { [openTo]: openTo })} role="listbox">
                    <div className={cn('menu-inner')}>
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cn('option', {
                                    selected: option.value === selectedValue,
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
            )}
        </div>
    )
}

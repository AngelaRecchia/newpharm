'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { gsap } from 'gsap'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import Icon from '@/components/atoms/Icon'

const cn = classNames.bind(styles)

interface AccordionItemProps {
    label: string
    children: ReactNode
    defaultOpen?: boolean
    variant?: 'primary' | 'secondary'
    bgColor?: 'surface' | 'white'
}

/**
 * AccordionItem — box espandibile con sfondo surface.
 *
 * Animazione apertura/chiusura con gsap.
 * L'icona cambia da "+" (more) a "−" (minus) in base allo stato.
 */
const AccordionItem = ({ label, children, defaultOpen = false, variant = 'primary', bgColor = 'surface' }: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!contentRef.current) return
        const content = contentRef.current

        if (isOpen) {
            const height = content.scrollHeight
            gsap.fromTo(
                content,
                { height: 0, opacity: 0 },
                {
                    height: 'auto',
                    opacity: 1,
                    duration: 0.4,
                    ease: 'power2.out',


                }
            )
        } else {
            gsap.to(content, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: isOpen ? 'power2.in' : 'ease.out',
            })
        }
    }, [isOpen])

    return (
        <div className={cn('wrapper', bgColor, { open: isOpen })}>
            <button
                type="button"
                className={cn('header')}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className={cn('label')}>{label}</span>
                <span className={cn('toggle', variant)}>
                    <Icon type={'more'} size="m" />
                </span>
            </button>

            <div ref={contentRef} className={cn('body')} inert={!isOpen ? true : undefined}>
                <div className={cn('body-inner')}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AccordionItem

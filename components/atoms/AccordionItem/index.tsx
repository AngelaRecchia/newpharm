'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { gsap } from 'gsap'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import Icon from '@/components/atoms/Icon'
import { useRefreshPageScroll } from '@/lib/context/smooth-scroll-context'

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
    const refreshPageScroll = useRefreshPageScroll()

    useEffect(() => {
        if (!contentRef.current) return
        const content = contentRef.current

        // L'altezza di <html>/body è fissata al viewport (100%), quindi il
        // ResizeObserver interno di Lenis non rileva la crescita del contenuto
        // durante l'animazione: senza un refresh esplicito il limite di scroll
        // resta quello precedente e la pagina si blocca finché non si forza
        // un resize (es. click sulla scrollbar nativa).
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
                    onStart: () => refreshPageScroll({ clampToLimit: false }),
                    onComplete: () => refreshPageScroll({ clampToLimit: false }),
                }
            )
        } else {
            gsap.to(content, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: isOpen ? 'power2.in' : 'ease.out',
                onComplete: () => refreshPageScroll(),
            })
        }
    }, [isOpen, refreshPageScroll])

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

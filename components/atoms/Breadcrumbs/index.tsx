'use client'

import classNames from 'classnames/bind'
import styles from './index.module.scss'
import SmartLink from '@/components/atoms/SmartLink'
import Icon from '@/components/atoms/Icon'

const cn = classNames.bind(styles)

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    className?: string
}

/**
 * Breadcrumbs — navigazione semantica con markup JSON-LD per SEO
 *
 * Usa `<nav>` + `<ol>` come da specifiche WAI-ARIA.
 * L'ultimo elemento è la pagina corrente (aria-current="page", non cliccabile).
 */
const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
    if (!items || items.length === 0) return null

    // JSON-LD structured data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.label,
            ...(item.href ? { item: item.href } : {}),
        })),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <nav aria-label="Breadcrumb" className={cn('nav', className)}>
                <ol className={cn('list')}>
                    {items.map((item, i) => {
                        const isLast = i === items.length - 1

                        return (
                            <li key={i} className={cn('item')}>
                                {i > 0 && (
                                    <span className={cn('separator')} aria-hidden="true">
                                        /
                                    </span>
                                )}

                                {isLast || !item.href ? (
                                    <span className={cn('current')} aria-current="page">
                                        {item.label}
                                    </span>
                                ) : (
                                    <SmartLink href={item.href} className={cn('link')}>
                                        {item.label}
                                    </SmartLink>
                                )}
                            </li>
                        )
                    })}
                </ol>
            </nav>
        </>
    )
}

export default Breadcrumbs

'use client'

import { useRef, useEffect, useState } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { storyblokEditable } from '@storyblok/react'
import { Spec_tableStoryblok } from '@/types/storyblok'
import { isEmpty } from '@/lib/api/utils/links'

const cn = classNames.bind(styles)

const SpecTable = ({ blok }: { blok: Spec_tableStoryblok }) => {
    const { title, description, table, table_code } = blok
    const hasTitle = !isEmpty(title)
    const hasDescription = !isEmpty(description)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [hasOverflow, setHasOverflow] = useState(false)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const check = () => {
            setHasOverflow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
        }

        check()
        el.addEventListener('scroll', check, { passive: true })
        const ro = new ResizeObserver(check)
        ro.observe(el)

        return () => {
            el.removeEventListener('scroll', check)
            ro.disconnect()
        }
    }, [])

    // Type guard per verificare se table ha la struttura thead/tbody
    const hasTableStructure = table && typeof table === 'object' && 'thead' in table && 'tbody' in table

    return (
        <div className={cn('wrapper')} {...storyblokEditable(blok as any)}>

            <div className={cn('container')}>
                {/* Header — titolo + descrizione */}
                {(hasTitle || hasDescription) && (
                    <div className={cn('header')}>
                        {hasTitle && <h2 className={cn('title')}>{title}</h2>}
                        {hasDescription && <p className={cn('description')}>{description}</p>}
                    </div>
                )}

                {/* Tabella */}
                <div className={cn('table-scroll-wrap', { 'table-scroll-wrap--overflow': hasOverflow })}>
                    <div ref={scrollRef} className={cn('table-scroll')}>
                        {table_code ? (
                            <div
                                className={cn('table-code')}
                                dangerouslySetInnerHTML={{ __html: table_code }}
                            />
                        ) : hasTableStructure ? (
                            <table className={cn('table')}>
                                <thead>
                                    <tr>
                                        {(table as any).thead.map((col: any, i: number) => (
                                            <th key={col._uid || i} className={cn('th')}>
                                                {i === 0 && !col.value?.trim() ? (
                                                    <span className={cn('dot')} aria-hidden="true" />
                                                ) : (
                                                    col.value
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(table as any).tbody.map((row: any, ri: number) => (
                                        <tr key={row._uid || ri}>
                                            {row.body.map((cell: any, ci: number) => (
                                                <td key={cell._uid || ci} className={cn('td', { 'td--name': ci === 0 })}>
                                                    {cell.value}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SpecTable

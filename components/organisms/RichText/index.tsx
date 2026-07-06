'use client'

import {
    ISbRichtext,
    StoryblokComponent,
    storyblokEditable,
    StoryblokRichText,
    type StoryblokRichTextResolvers
} from '@storyblok/react'
import React, { useMemo, useRef } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'


const cn = classNames.bind(styles)

interface RichTextProps {
    content?: ISbRichtext | string | null
    className?: string
    blok?: any
    raw?: boolean
}


export default function RichText({ content, className, blok, raw = false }: RichTextProps) {
    const blokKeyCounter = useRef(0)
    blokKeyCounter.current = 0

    const resolvers = useMemo((): StoryblokRichTextResolvers<React.ReactElement> => ({
        paragraph: (node) => {
            const { textAlign, ...safeAttrs } = (node.attrs || {}) as any
            const style = textAlign ? { textAlign } : undefined
            return React.createElement('p', { ...safeAttrs, style }, node.children)
        },
        blok: (node) => {
            const nestedBlok = node.attrs
            const blokIndex = blokKeyCounter.current++
            const baseKey =
                nestedBlok?.id ||
                nestedBlok?._uid ||
                nestedBlok?.component ||
                'blok'
            const uniqueKey = `${baseKey}-${blokIndex}`

            if (!nestedBlok) {
                return React.createElement(React.Fragment)
            }

            if (nestedBlok.body && Array.isArray(nestedBlok.body)) {
                return React.createElement(
                    'div',
                    {
                        key: `nested-wrapper-${uniqueKey}`,
                        className: cn('nested-blok'),
                    },
                    nestedBlok.body.map((childBlok: any, index: number) =>
                        React.createElement(StoryblokComponent, {
                            key: `${childBlok._uid || childBlok.id || 'child'}-${blokIndex}-${index}`,
                            blok: childBlok,
                            ...(childBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {}),
                        })
                    )
                )
            }

            return React.createElement(
                'div',
                {
                    key: uniqueKey,
                    className: cn('nested-blok'),
                },
                React.createElement(StoryblokComponent, {
                    key: `${uniqueKey}-component`,
                    blok: nestedBlok,
                    ...(nestedBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {}),
                })
            )
        },
    }), [])

    if (!content || typeof content !== 'object') {
        return <></>
    }

    return (
        <div
            className={cn('richtext', className, { raw })}
            {...(blok ? storyblokEditable(blok) : {})}
        >
            <StoryblokRichText
                doc={content as any}
                resolvers={resolvers}
            />
        </div>
    )
}

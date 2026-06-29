'use client'

import {
    ISbRichtext,
    StoryblokComponent,
    storyblokEditable,
    StoryblokRichText,
    type StoryblokRichTextResolvers
} from '@storyblok/react'
import React, { useMemo } from 'react'
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
    const resolvers = useMemo((): StoryblokRichTextResolvers<React.ReactElement> => ({
        paragraph: (node) => {
            const { textAlign, ...safeAttrs } = (node.attrs || {}) as any
            const style = textAlign ? { textAlign } : undefined
            return React.createElement('p', { ...safeAttrs, style }, node.children)
        },
        blok: (node) => {
            const nestedBlok = node.attrs

            if (!nestedBlok) {
                return React.createElement(React.Fragment)
            }

            if (nestedBlok.body && Array.isArray(nestedBlok.body)) {
                const parentKey = nestedBlok._uid || nestedBlok.id || 'nested'
                return React.createElement(
                    'div',
                    {
                        key: `nested-wrapper-${parentKey}`,
                        className: cn('nested-blok'),
                    },
                    nestedBlok.body.map((childBlok: any, index: number) =>
                        React.createElement(StoryblokComponent, {
                            key: childBlok._uid || `child-${parentKey}-${index}`,
                            blok: childBlok,
                            ...(childBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {}),
                        })
                    )
                )
            }

            const uniqueKey = nestedBlok._uid || nestedBlok.id || `nested-${nestedBlok.component}`

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

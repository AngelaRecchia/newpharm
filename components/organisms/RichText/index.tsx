'use client'

import {
    ISbRichtext,
    StoryblokComponent,
    storyblokEditable,
    StoryblokRichText,
    type StoryblokRichTextResolvers
} from '@storyblok/react'
import React from 'react'
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
    if (!content || typeof content !== 'object') {
        return <></>
    }


    const resolvers: StoryblokRichTextResolvers<React.ReactElement> = {
        // Resolver per paragrafi — strip attributi non-DOM come textAlign
        paragraph: (node) => {
            const { textAlign, ...safeAttrs } = (node.attrs || {}) as any
            const style = textAlign ? { textAlign } : undefined
            return React.createElement(
                'p',
                { ...safeAttrs, style, key: `p-${Math.random()}` },
                node.children
            )
        },
        // Resolver per i nodi di tipo "blok" (nested bloks)
        blok: (node) => {
            // node.attrs contiene i dati del blok annidato
            const nestedBlok = node.attrs



            if (!nestedBlok) {
                // Restituisce un elemento React vuoto invece di null
                return React.createElement(React.Fragment)
            }

            // Se il blok ha un body con altri nested bloks, renderizzali
            if (nestedBlok.body && Array.isArray(nestedBlok.body)) {
                const parentKey = nestedBlok._uid || nestedBlok.id || `nested-${Math.random()}`
                return React.createElement(
                    'div',
                    {
                        key: `nested-wrapper-${parentKey}`,
                        className: cn('nested-blok')
                    },
                    nestedBlok.body.map((childBlok: any, index: number) =>
                        React.createElement(StoryblokComponent, {
                            key: childBlok._uid ? `child-${childBlok._uid}-${index}` : `child-${parentKey}-${index}`,
                            blok: childBlok,
                            ...(childBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {})
                        })
                    )
                )
            }


            // Renderizza il blok direttamente usando StoryblokComponent
            const uniqueKey = nestedBlok._uid
                ? `nested-${nestedBlok._uid}`
                : nestedBlok.id
                    ? `nested-${nestedBlok.id}`
                    : `nested-${Math.random()}`

            return React.createElement(
                'div',
                {
                    key: uniqueKey,
                    className: cn('nested-blok')
                },
                React.createElement(StoryblokComponent, {
                    key: `${uniqueKey}-component`,
                    blok: nestedBlok,
                    ...(nestedBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {})
                })
            )
        },
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

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
import { GlossaryTermButton } from '@/components/atoms/GlossaryText'
import { useGlossary } from '@/lib/glossary/context'
import { buildGlossaryMatcher } from '@/lib/glossary/match'
import styles from './index.module.scss'


const cn = classNames.bind(styles)

interface RichTextProps {
    content?: ISbRichtext | string | null
    className?: string
    blok?: any
    raw?: boolean
    enableGlossary?: boolean
}


export default function RichText({ content, className, blok, raw = false, enableGlossary = false }: RichTextProps) {
    const blokKeyCounter = useRef(0)
    blokKeyCounter.current = 0
    const glossary = useGlossary()
    const glossaryItems = enableGlossary ? glossary?.items : undefined
    const openGlossary = glossary?.open
    const matcher = useMemo(
        () => (glossaryItems && glossaryItems.length > 0
            ? buildGlossaryMatcher(glossaryItems)
            : null),
        [glossaryItems],
    )

    const resolvers = useMemo((): StoryblokRichTextResolvers<React.ReactElement> => ({
        paragraph: (node) => {
            const { textAlign, ...safeAttrs } = (node.attrs || {}) as any
            const style = textAlign ? { textAlign } : undefined
            return React.createElement('p', { ...safeAttrs, style }, node.children)
        },
        ...(matcher && openGlossary
            ? {
                text: (node: any, context: any) => {
                    const text = node?.text || ''
                    const marks = node?.marks || []
                    const insideLink = marks.some(
                        (mark: { type?: string }) =>
                            mark.type === 'link' || mark.type === 'anchor',
                    )

                    let inner: React.ReactNode = text
                    if (text && !insideLink) {
                        const hits = matcher(text)
                        if (
                            hits.length > 1 ||
                            (hits.length === 1 && hits[0].type === 'term')
                        ) {
                            inner = (
                                <>
                                    {hits.map((hit, index) =>
                                        hit.type === 'text' ? (
                                            <React.Fragment key={`text-${index}`}>
                                                {hit.value}
                                            </React.Fragment>
                                        ) : (
                                            <GlossaryTermButton
                                                key={`${hit.uid}-${index}`}
                                                uid={hit.uid}
                                            >
                                                {hit.value}
                                            </GlossaryTermButton>
                                        ),
                                    )}
                                </>
                            )
                        }
                    }

                    return marks.reduce(
                        (current: React.ReactNode, mark: { type: string }) => {
                            const resolver = context?.mergedResolvers?.get(mark.type)
                            if (!resolver) return current
                            return resolver({ ...mark, text: current }, context)
                        },
                        inner,
                    )
                },
            }
            : {}),
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
    }), [matcher, openGlossary])

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

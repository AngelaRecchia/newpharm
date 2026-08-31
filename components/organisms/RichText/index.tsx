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
import { applyRichTextMarks } from '@/lib/richtext/applyRichTextMarks'
import { renderTextWithBreaks } from '@/lib/richtext/renderTextWithBreaks'
import styles from './index.module.scss'


const cn = classNames.bind(styles)

type RichTextContainer = 'lg' | 'narrow' | false

interface RichTextProps {
    content?: ISbRichtext | string | null
    className?: string
    blok?: any
    raw?: boolean
    enableGlossary?: boolean
    container?: RichTextContainer
}


export default function RichText({
    content,
    className,
    blok,
    raw = false,
    enableGlossary = false,
    container = 'lg',
}: RichTextProps) {
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
        hard_break: () => React.createElement('br'),
        ...(enableGlossary
            ? {
                text: (node: any) => {
                    const text = node?.text || ''
                    const marks = node?.marks || []
                    const insideLink = marks.some(
                        (mark: { type?: string }) =>
                            mark.type === 'link' || mark.type === 'anchor',
                    )

                    let inner: React.ReactNode = renderTextWithBreaks(text)
                    if (text && !insideLink && matcher && openGlossary) {
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
                                                {renderTextWithBreaks(hit.value)}
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

                    return applyRichTextMarks(marks, inner) as React.ReactElement
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
    }), [enableGlossary, matcher, openGlossary])

    if (!content || typeof content !== 'object') {
        return <></>
    }

    return (
        <div
            className={cn(
                'richtext',
                {
                    raw,
                    'container-lg': !raw && container === 'lg',
                    'container-narrow': !raw && container === 'narrow',
                },
                className,
            )}
            {...(blok ? storyblokEditable(blok) : {})}
        >
            <StoryblokRichText
                doc={content as any}
                resolvers={resolvers}
            />
        </div>
    )
}

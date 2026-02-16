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
import AssetComponent, { getFileType } from '@/components/atoms/Asset'
import { AssetStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles)

interface RichTextProps {
    content?: ISbRichtext | string | null
    className?: string
    blok?: any
}


export default function RichText({ content, className, blok }: RichTextProps) {
    if (!content || typeof content !== 'object') {
        return <></>
    }


    const resolvers: StoryblokRichTextResolvers<React.ReactElement> = {
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
                return React.createElement(
                    'div',
                    {
                        key: nestedBlok._uid || nestedBlok.id,
                        className: cn('nested-blok')
                    },
                    nestedBlok.body.map((childBlok: any) =>
                        React.createElement(StoryblokComponent, {
                            key: childBlok._uid,
                            blok: childBlok,
                            ...(childBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {})
                        })
                    )
                )
            }


            // Renderizza il blok direttamente usando StoryblokComponent
            return React.createElement(
                'div',
                {
                    key: nestedBlok._uid || nestedBlok.id,
                    className: cn('nested-blok')
                },
                React.createElement(StoryblokComponent, {
                    blok: nestedBlok,
                    ...(nestedBlok.component === 'asset' ? { mode: 'fit', size: 'm' } : {})
                })
            )
        },
    }

    return (
        <div
            className={cn('richtext', className)}
            {...(blok ? storyblokEditable(blok) : {})}
        >
            <StoryblokRichText
                doc={content as any}
                resolvers={resolvers}
            />
        </div>
    )
}

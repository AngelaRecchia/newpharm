'use client'

import { LinkStoryblok } from '@/types/storyblok'
import Button from '@/components/atoms/Button'
import { storyblokEditable } from '@storyblok/react'

/**
 * Componente Link di Storyblok che renderizza un Button
 * Mappa le varianti: black -> secondary, blue -> primary
 */
export default function Link({ blok }: { blok?: LinkStoryblok }) {
    if (!blok) {
        return null
    }



    const { label, link } = blok
    // variant potrebbe non essere nel tipo generato, quindi accediamo tramite any
    const variant = (blok as any).variant

    // Mappa le varianti: black -> secondary, blue -> primary
    // Default: primary se non specificato o se variant non è black/blue
    const buttonVariant: 'primary' | 'secondary' | 'tertiary' =
        variant === 'black' ? 'secondary' :
            variant === 'blue' ? 'primary' :
                'primary'

    return (
        <Button
            blok={blok}
            label={label || undefined}
            link={link || undefined}
            variant={buttonVariant}

        />
    )
}

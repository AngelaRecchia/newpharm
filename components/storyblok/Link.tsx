'use client'

import { LinkStoryblok } from '@/types/storyblok'
import Button from '@/components/atoms/Button'

/**
 * Componente Link di Storyblok che renderizza un Button.
 * Variante visiva: black -> secondary, blue -> primary.
 * Azione (link / copy / popup) dal campo plugin `action`.
 */
export default function Link({ blok }: { blok?: LinkStoryblok }) {
    if (!blok) {
        return null
    }

    const buttonVariant: 'primary' | 'secondary' | 'tertiary' =
        blok.variant === 'black' ? 'secondary' :
            blok.variant === 'blue' ? 'primary' :
                'primary'

    return (
        <Button
            blok={blok}
            label={blok.label || undefined}
            link={blok}
            variant={buttonVariant}
        />
    )
}

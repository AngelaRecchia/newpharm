'use client'

import { useHeaderVariant } from '@/lib/context/header-variant-context'
import Header from './Header'
import { HeaderStoryblok } from '@/types/storyblok'
import { useEffect } from 'react'

interface HeaderWrapperProps {
    blok?: HeaderStoryblok
}

export default function HeaderWrapper({ blok }: HeaderWrapperProps) {
    const variant = useHeaderVariant()

    // Aggiorna la classe del main in base alla variante dell'header
    useEffect(() => {
        const main = document.querySelector('.main')
        if (main) {
            if (variant === 'white') {
                main.classList.add('main-with-header')
            } else {
                main.classList.remove('main-with-header')
            }
        }
    }, [variant])

    return <Header blok={blok} variant={variant} />
}

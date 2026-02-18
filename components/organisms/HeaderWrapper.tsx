'use client'

import { useHeaderVariant } from '@/lib/context/header-variant-context'
import Header from './Header'
import { HeaderStoryblok } from '@/types/storyblok'

interface HeaderWrapperProps {
    blok?: HeaderStoryblok
}

export default function HeaderWrapper({ blok }: HeaderWrapperProps) {
    const variant = useHeaderVariant()

    return <Header blok={blok} variant={variant} />
}

'use client'

import { storyblokEditable } from '@storyblok/react'
import { AssetStoryblok } from '@/types/storyblok'
import AssetComponent from '@/components/atoms/Asset'

export default function Asset({ blok }: { blok?: AssetStoryblok }) {
    if (!blok) {
        return null
    }

    // Se ha mobile o desktop, passa come oggetto con breakpoints
    // Altrimenti, se ha un asset diretto (non dovrebbe succedere con questo componente, ma per sicurezza)
    const asset = (blok.mobile || blok.desktop)
        ? { mobile: blok.mobile || null, desktop: blok.desktop || null }
        : null

    return (
        <AssetComponent
            {...storyblokEditable(blok as any)}
            asset={asset}
        />
    )
}

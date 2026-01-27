'use client'

import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import { SettingsStoryblok } from '@/types/storyblok'

/**
 * Settings Component (Global Settings)
 * Wrapper Storyblok per il componente Settings
 * Questo componente contiene Header, Footer e altri elementi globali
 */
export default function Settings({ blok }: { blok: SettingsStoryblok }) {

  return (
    <div {...storyblokEditable(blok as any)} data-settings="global" >
      {/* Renderizza tutti i componenti nested (header, footer, ecc.) */}
      {blok.header && Array.isArray(blok.header) && blok.header.length > 0 && (
        <div data-slot="header">
          {blok.header.map((nestedBlok: any) => (
            <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
          ))}
        </div>
      )}

      <div style={{ minHeight: '100vh' }}></div>

      {blok.footer && Array.isArray(blok.footer) && blok.footer.length > 0 && (
        <div data-slot="footer">
          {blok.footer.map((nestedBlok: any) => (
            <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
          ))}
        </div>
      )}
    </div>
  )
}

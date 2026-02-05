'use client'

import { storyblokEditable } from '@storyblok/react'
import { SettingsStoryblok } from '@/types/storyblok'
import Header from '@/components/organisms/Header'
import Footer from '@/components/organisms/Footer'

export default function Settings({ blok }: { blok?: SettingsStoryblok }) {
  if (!blok) {
    return null
  }

  return (
    <div {...storyblokEditable(blok as any)} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {blok.header && blok.header.length > 0 && (
        <Header blok={blok.header[0]} />
      )}
      <main style={{ flexBasis: '100%' }}></main>
      {blok.footer && blok.footer.length > 0 && (
        <Footer blok={blok.footer[0]} />
      )}
    </div>
  )
}

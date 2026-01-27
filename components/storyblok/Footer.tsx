'use client'

import { storyblokEditable } from '@storyblok/react'
import { FooterStoryblok } from '@/types/adjusted-types'
import FooterComponent from '@/components/organisms/Footer'
export default function Footer({ blok }: { blok?: FooterStoryblok }) {
  if (!blok) {
    return null
  }

  return (
    <footer {...storyblokEditable(blok as any)}>
      <FooterComponent {...blok} />
    </footer>
  )
}

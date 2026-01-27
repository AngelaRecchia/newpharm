'use client'

import { storyblokEditable } from '@storyblok/react'
import { HeaderStoryblok, Nav_itemStoryblok } from '@/types/storyblok'
import HeaderComponent from '@/components/organisms/Header'

export default function Header({ blok }: { blok?: HeaderStoryblok }) {
  if (!blok) {
    return null
  }

  return (
    <div {...storyblokEditable(blok as any)}>
      <HeaderComponent navItems={blok.nav_items as Nav_itemStoryblok[]} />
    </div>
  )
}

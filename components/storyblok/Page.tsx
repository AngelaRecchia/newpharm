'use client'

import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import { PageStoryblok } from '@/types/storyblok'

export default function Page({ blok }: { blok: PageStoryblok }) {
  return (
    <div {...storyblokEditable(blok)}>
      {blok.body?.map((nestedBlok: any) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  )
}

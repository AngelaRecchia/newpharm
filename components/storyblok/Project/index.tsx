'use client'

import dynamic from 'next/dynamic'
import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import type { AssetStoryblok, HeroStoryblok, ProjectStoryblok } from '@/types/storyblok'

const Hero = dynamic(() => import('@/components/organisms/Hero'))

function projectAssets(blok: ProjectStoryblok): AssetStoryblok[] | undefined {
  if (blok.asset && blok.asset.length > 0) return blok.asset
  if (blok.image && blok.image.length > 0) return blok.image
  return undefined
}

export default function Project({ blok }: { blok: ProjectStoryblok }) {
  const heroBlok: HeroStoryblok = {
    _uid: `${blok._uid}-hero`,
    component: 'hero',
    variant: 'primary',
    title: blok.title,
    subtitle: blok.short_description || undefined,
    background: projectAssets(blok),
  }

  return (
    <div {...storyblokEditable(blok as any)}>
      <Hero blok={heroBlok} />
      {blok.body?.map((nestedBlok, index) => (
        <StoryblokComponent
          blok={nestedBlok}
          key={`${nestedBlok._uid}-${index}`}
        />
      ))}
    </div>
  )
}

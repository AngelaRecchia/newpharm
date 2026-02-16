'use client'

import { storyblokInit, apiPlugin, loadStoryblokBridge } from '@storyblok/react'
import { ReactNode, useEffect } from 'react'
import { shouldEnableBridge } from './api/storyblok/config'

// Import components
import Page from '@/components/storyblok/Page'
import Settings from '@/components/storyblok/Settings'
import Asset from '@/components/storyblok/Asset'
import Link from '@/components/storyblok/Link'
import Header from '@/components/organisms/Header'
import Footer from '@/components/organisms/Footer'
import HeroComponent from '@/components/organisms/Hero'
import DivisionBox from '@/components/organisms/DivisionBox'
import CtaBox from '@/components/organisms/CtaBox'
import FullBanner from '@/components/organisms/FullBanner'
import SplitBanner from '@/components/organisms/SplitBanner'
import Story from '@/components/storyblok/Story'

const components = {

  // Organisms
  hero: HeroComponent,
  division_box: DivisionBox,
  cta_box: CtaBox,
  full_banner: FullBanner,
  split_banner: SplitBanner,

  // Atoms
  asset: Asset,
  link: Link,

  //
  page: Page,
  settings: Settings,
  story: Story,
  header: Header,
  footer: Footer,
}

// Initialize Storyblok at module level (runs once when module loads)
// This ensures components are registered before any rendering occurs
storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || '',
  use: [apiPlugin],
  components,
  bridge: shouldEnableBridge(), // Enable bridge for visual editor in draft mode
})

/**
 * StoryblokProvider - Provider client-side per Storyblok
 * Carica il bridge per il visual editor
 */
export function StoryblokProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Carica il bridge di Storyblok solo in draft mode (non in produzione)
    if (shouldEnableBridge() && typeof window !== 'undefined') {
      loadStoryblokBridge().catch((error) => {
        console.error('Error loading Storyblok bridge:', error)
      })
    }
  }, [])

  return <>{children}</>
}

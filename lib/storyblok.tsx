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
import Carousel from '@/components/organisms/Carousel'
import Story from '@/components/storyblok/Story'
import Banneraccordion from '@/components/organisms/BannerAccordion'
import Product from '@/components/storyblok/Product'
import StickyImage from '@/components/organisms/StickyImage'
import VideoYt from '@/components/organisms/VideoYt'
import SpecTable from '@/components/organisms/SpecTable'
import IconTextHighlight from '@/components/organisms/IconTextHighlight'
import Tabs from '@/components/organisms/Tabs'
const components = {

  // Organisms
  hero: HeroComponent,
  division_box: DivisionBox,
  cta_box: CtaBox,
  full_banner: FullBanner,
  split_banner: SplitBanner,
  carousel: Carousel,
  banner_accordion: Banneraccordion,
  sticky_image: StickyImage,
  video_yt: VideoYt,
  spec_table: SpecTable,
  icon_text_highlight: IconTextHighlight,
  tabs: Tabs,

  // Atoms
  asset: Asset,
  link: Link,

  // Templates
  product: Product,
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
 * Carica il bridge per il visual editor e ascolta eventi per invalidare la cache
 */
export function StoryblokProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Carica il bridge di Storyblok solo in draft mode (non in produzione)
    if (!shouldEnableBridge() || typeof window === 'undefined') {
      return
    }

    // Funzione per invalidare la cache
    const invalidateCache = async () => {
      try {
        const response = await fetch('/api/cache/invalidate', {
          method: 'POST',
        })
        if (response.ok) {
          console.log('✅ Cache invalidated after Storyblok edit')
        }
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
    }

    // Il bridge di Storyblok espone eventi tramite window.storyblok
    // Ascolta quando il contenuto cambia
    const handleInput = () => {
      // Debounce per evitare troppe chiamate
      clearTimeout((window as any).__storyblokCacheInvalidationTimeout)
        ; (window as any).__storyblokCacheInvalidationTimeout = setTimeout(
          invalidateCache,
          1000
        )
    }

    let bridgeLoaded = false

    loadStoryblokBridge()
      .then(() => {
        bridgeLoaded = true

        // Ascolta eventi del bridge
        // Il bridge emette eventi quando il contenuto cambia
        if ((window as any).storyblok) {
          ; (window as any).storyblok.on(['input', 'change', 'published'], handleInput)
        }

        // Fallback: ascolta anche eventi custom del bridge
        window.addEventListener('storyblok:input', handleInput)
        window.addEventListener('storyblok:change', handleInput)
        window.addEventListener('storyblok:published', handleInput)
      })
      .catch((error) => {
        console.error('Error loading Storyblok bridge:', error)
      })

    // Cleanup function
    return () => {
      if (bridgeLoaded) {
        if ((window as any).storyblok) {
          ; (window as any).storyblok.off(['input', 'change', 'published'], handleInput)
        }
        window.removeEventListener('storyblok:input', handleInput)
        window.removeEventListener('storyblok:change', handleInput)
        window.removeEventListener('storyblok:published', handleInput)
      }
      clearTimeout((window as any).__storyblokCacheInvalidationTimeout)
    }
  }, [])

  return <>{children}</>
}

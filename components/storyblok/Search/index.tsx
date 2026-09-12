'use client'

import { Suspense } from 'react'
import { storyblokEditable } from '@storyblok/react'
import type { SearchStoryblok } from '@/types/storyblok'
import Search from '@/components/organisms/Search'

function SearchFallback() {
  return null
}

export default function SearchBlok({ blok }: { blok?: SearchStoryblok }) {
  if (!blok) return null

  return (
    <div {...storyblokEditable(blok as any)}>
      <Suspense fallback={<SearchFallback />}>
        <Search
          title={blok.title}
          subtitle={blok.subtitle}
          suggestedSearches={
            blok.suggested_searches
              ? blok.suggested_searches.split(',').map((s) => s.trim()).filter(Boolean)
              : null
          }
        />
      </Suspense>
    </div>
  )
}

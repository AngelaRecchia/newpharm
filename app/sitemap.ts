import type { MetadataRoute } from 'next'
import { getAllStories } from '@/lib/api/storyblok/stories'
import localeConfig from '@/i18n/locales.json'

const BASE_URL = 'https://newpharm-six.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await getAllStories()

  const entries: MetadataRoute.Sitemap = []

  for (const locale of localeConfig.locales) {
    const localeStories = stories.filter((story) => {
      const fullSlug = story.full_slug || ''
      return fullSlug.startsWith(`${locale}/`)
    })

    for (const story of localeStories) {
      const fullSlug = story.full_slug || ''
      const slugWithoutLocale = fullSlug.replace(`${locale}/`, '')
      const url = slugWithoutLocale
        ? `${BASE_URL}/${locale}/${slugWithoutLocale}`
        : `${BASE_URL}/${locale}`

      entries.push({
        url,
        lastModified: story.published_at || story.created_at,
        changeFrequency: 'weekly',
      })
    }
  }

  return entries
}

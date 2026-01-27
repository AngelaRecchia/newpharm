import { getAllStories, getStory } from '@/lib/api/storyblok/stories'
import { getLangs } from '@/lib/api/storyblok/languages'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    locale: string
    slug?: string[]
  }>
}

/**
 * Generate static params for all locale + slug combinations
 * This runs at build time to pre-render all pages
 */
export async function generateStaticParams() {
  try {
    // Get all available locales
    const locales = await getLangs()

    // Get all stories (published in production, draft in development)
    const stories = await getAllStories()

    const params: Array<{ locale: string; slug?: string[] }> = []

    for (const locale of locales) {
      // Get stories for this locale
      const localeStories = stories.filter((story) => {
        const fullSlug = story.full_slug || ''
        return fullSlug.startsWith(`${locale}/`)
      })

      for (const story of localeStories) {
        const fullSlug = story.full_slug || ''

        // Remove locale prefix from slug
        const slugWithoutLocale = fullSlug.replace(`${locale}/`, '')

        // Skip empty slugs (homepage is handled separately)
        if (!slugWithoutLocale) {
          // Homepage
          params.push({ locale, slug: undefined })
          continue
        }

        // Split slug into segments for catch-all route
        const slugSegments = slugWithoutLocale.split('/')

        params.push({
          locale,
          slug: slugSegments,
        })
      }
    }

    console.log(`✅ Generated ${params.length} static params for ${locales.length} locales`)

    return params
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

/**
 * Page per route con header/footer (route normali)
 */
export default async function WithLayoutPage({ params }: PageProps) {
  const { locale, slug } = await params

  // Enable static rendering
  setRequestLocale(locale)

  // Costruisce lo slug per Storyblok (senza locale)
  const storySlug = slug && slug.length > 0 ? slug.join('/') : ''

  // Usa la funzione centralizzata per recuperare la story
  const story = await getStory(storySlug, locale)

  if (!story) {
    notFound()
  }
  return (
    <>
      {story.content && (
        <StoryblokRenderer blok={story.content} />
      )}
    </>
  )


}

/**
 * Generate metadata with locale support for static rendering
 */
export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params

  // Pass locale to getTranslations for static rendering
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  const storySlug = slug && slug.length > 0 ? slug.join('/') : ''

  return {
    title: 'Newpharm',
    description: 'Newpharm - Progetto Next.js con Storyblok',
  }
}

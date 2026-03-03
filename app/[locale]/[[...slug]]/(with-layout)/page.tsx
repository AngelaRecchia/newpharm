import { getAllStories, getStory, getRelatedStoriesByTags, getRelatedProjectsByProduct } from '@/lib/api/storyblok/stories'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageStoryblok, StoryStoryblok } from '@/types/storyblok'
import localeConfig from '@/i18n/locales.json'

interface PageProps {
  params: Promise<{
    locale: string
    slug?: string[]
  }>
}

/**
 * Generate static params for all locale + slug combinations.
 * Locales come from i18n/locales.json (generated at build time).
 * Stories are fetched from Storyblok CDN API.
 */
export async function generateStaticParams() {
  try {
    const locales = localeConfig.locales
    const stories = await getAllStories()

    const params: Array<{ locale: string; slug?: string[] }> = []

    for (const locale of locales) {
      const localeStories = stories.filter((story) => {
        const fullSlug = story.full_slug || ''
        return fullSlug.startsWith(`${locale}/`)
      })

      for (const story of localeStories) {
        const fullSlug = story.full_slug || ''
        const slugWithoutLocale = fullSlug.replace(`${locale}/`, '')

        if (!slugWithoutLocale) {
          params.push({ locale, slug: undefined })
          continue
        }

        params.push({
          locale,
          slug: slugWithoutLocale.split('/'),
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

export const dynamicParams = true
export const revalidate = 3600

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

  // Se il content è una Story, fetcha le story correlate
  if (story.content?.component === 'story') {

    const storyContent = story.content as StoryStoryblok
    const relatedStories = await getRelatedStoriesByTags(
      storyContent.tag,
      storySlug,
      locale
    )

    // Inietta le story correlate nel blok
    if (relatedStories.length > 0) {
      story.content = {
        ...storyContent,
        related_stories: relatedStories
      }
    }
  }

  // Se il content è un Product, fetcha i progetti correlati (query inversa)
  if (story.content?.component === 'product') {
    const relatedProjects = await getRelatedProjectsByProduct(
      story.uuid,
      locale
    )

    if (relatedProjects.length > 0) {
      story.content = {
        ...story.content,
        related_projects: relatedProjects
      }
    }
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

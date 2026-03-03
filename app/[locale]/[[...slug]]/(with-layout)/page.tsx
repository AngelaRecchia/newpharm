import { getAllStories, getStory, getRelatedStoriesByTags, getRelatedProjectsByProduct } from '@/lib/api/storyblok/stories'
import { getLangs } from '@/lib/api/storyblok/languages'
import { isProduction } from '@/lib/api/storyblok/config'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageStoryblok, StoryStoryblok } from '@/types/storyblok'

interface PageProps {
  params: Promise<{
    locale: string
    slug?: string[]
  }>
}

/**
 * Generate static params for all locale + slug combinations
 * Solo in produzione per performance, in draft mode usa dynamic rendering
 */
export async function generateStaticParams() {
  // In draft mode, non generare static params (usa dynamic rendering)
  // Questo permette di vedere le modifiche immediatamente
  if (!isProduction()) {
    console.log('📝 Draft mode: using dynamic rendering (no static params)')
    return []
  }

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
 * Configurazione rendering:
 * - Draft mode: dynamic (vedi modifiche immediate) - gestito da generateStaticParams che ritorna []
 * - Production: static (performance) - gestito da generateStaticParams che genera tutti i params
 * 
 * Nota: Non possiamo usare espressioni condizionali per dynamic/revalidate.
 * La logica è gestita in generateStaticParams:
 * - Se ritorna [] → Next.js usa dynamic rendering
 * - Se ritorna params → Next.js usa static generation
 */
export const dynamic = 'auto' // Auto: Next.js decide in base a generateStaticParams
export const revalidate = 3600 // 1h revalidation in production (ignorato in draft mode)

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

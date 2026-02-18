import { getAllStories, getStory, getRelatedStoriesByTags } from '@/lib/api/storyblok/stories'
import { getLangs } from '@/lib/api/storyblok/languages'
import { isProduction } from '@/lib/api/storyblok/config'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import HeaderVariantSync from '@/components/client/HeaderVariantSync'
import { PageStoryblok, HeroStoryblok, StoryStoryblok } from '@/types/storyblok'

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
 * - Draft mode: dynamic (vedi modifiche immediate)
 * - Production: static (performance)
 */
export const dynamic = isProduction() ? 'auto' : 'force-dynamic'
export const revalidate = isProduction() ? 3600 : 0 // 1h in prod, no cache in draft

/**
 * Determina la variante dell'header in base al primo blocco nel body della page
 * Se il primo blocco è hero primary, hero secondary, o division_box, 
 * l'header è transparent, altrimenti è white
 */
function getHeaderVariant(firstBlock: any): 'transparent' | 'white' {
  if (!firstBlock) {
    return 'white'
  }

  // Controlla se è un hero con variant primary o secondary
  if (firstBlock.component === 'hero') {
    const heroBlock = firstBlock as HeroStoryblok
    if (heroBlock.variant === 'primary' || heroBlock.variant === 'secondary') {
      return 'transparent'
    }
  }

  // Controlla se è un division_box
  if (firstBlock.component === 'division_box') {
    return 'transparent'
  }

  return 'white'
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

  // Determina la variante dell'header in base al primo blocco del body
  let headerVariant: 'transparent' | 'white' = 'white'

  if (story.content) {
    const pageContent = story.content as PageStoryblok

    // Controlla il primo blocco nel body
    if (pageContent.body && pageContent.body.length > 0) {
      const firstBlock = pageContent.body[0]
      headerVariant = getHeaderVariant(firstBlock)
    }
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



  return (
    <>
      <HeaderVariantSync variant={headerVariant} />
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

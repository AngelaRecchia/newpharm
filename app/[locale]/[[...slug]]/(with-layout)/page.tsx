import { getAllStories, getStory, getRelatedStoriesByTags, getRelatedProjectsByProduct } from '@/lib/api/storyblok/stories'
import { enrichListingBloks, resolveProductStories, resolveStoryStories } from '@/lib/listing/resolveListingItems'
import { enrichCarouselBloks } from '@/lib/carousel/resolveCarouselItems'
import { mapStoryToNewsCard, sortStoriesByDate } from '@/lib/carousel/mapStoryToNewsCard'
import {
  getParentFullSlug,
  getRelatedCategoryProducts,
} from '@/lib/products/relatedCategoryProducts'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageStoryblok, StoryStoryblok, JobStoryblok } from '@/types/storyblok'
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

  if (!story || story.content?.component === 'glossary') {
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

  // Se il content è un Job, fetcha le ultime news
  if (story.content?.component === 'job') {
    const stories = await resolveStoryStories(locale)
    story.content = {
      ...(story.content as JobStoryblok),
      latest_stories: sortStoriesByDate(stories)
        .slice(0, 8)
        .map(mapStoryToNewsCard),
    }
  }

  // Se il content è un Product, fetcha i progetti correlati (query inversa)
  // e i prodotti della stessa categoria per il carousel in fondo pagina.
  const attachProductRelations =
    story.content?.component === 'product'
      ? (async () => {
          const [relatedProjects, allProducts] = await Promise.all([
            getRelatedProjectsByProduct(story.uuid, locale),
            resolveProductStories(locale),
          ])

          if (relatedProjects.length > 0) {
            story.content.related_projects = relatedProjects
          }

          const relatedCategoryProducts = getRelatedCategoryProducts(
            allProducts,
            story.uuid,
            story.content,
          )

          if (relatedCategoryProducts.length > 0) {
            story.content.related_category_products = relatedCategoryProducts
            story.content.related_category_parent_slug = getParentFullSlug(
              story.full_slug,
            )
          }
        })()
      : Promise.resolve()

  await Promise.all([
    attachProductRelations,
    enrichListingBloks(story.content, locale),
    enrichCarouselBloks(story.content, locale),
  ])

  return (
    <>
      {story.content && (
        <StoryblokRenderer blok={story.content} story={story} />
      )}
    </>
  )
}

/**
 * Generate metadata with locale support for static rendering
 */
export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params

  const storySlug = slug && slug.length > 0 ? slug.join('/') : ''
  const story = await getStory(storySlug, locale)

  if (story?.content?.component === 'glossary') {
    notFound()
  }

  const title = story?.name
    ? `${story.name} | Newpharm`
    : 'Newpharm'

  const description =
    story?.content?.short_description ||
    story?.content?.description ||
    ''

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Newpharm',
    },
    alternates: {
      canonical: `/${locale}${storySlug ? `/${storySlug}` : ''}`,
    },
  }
}

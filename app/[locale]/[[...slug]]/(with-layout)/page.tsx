import { getAllStories, getStory, getStoriesByComponent, getRelatedStoriesByTags, getRelatedProjectsByProduct } from '@/lib/api/storyblok/stories'
import { buildStoryblokNavigationHref } from '@/lib/api/utils/links'
import { enrichListingBloks, resolveProductStories, resolveStoryStories } from '@/lib/listing/resolveListingItems'
import { enrichCarouselBloks, resolveCarouselItems } from '@/lib/carousel/resolveCarouselItems'
import { parseCarouselVariant } from '@/lib/carousel/parseCarouselVariant'
import { mapStoryToNewsCard, sortStoriesByDate } from '@/lib/carousel/mapStoryToNewsCard'
import {
  getParentFullSlug,
  getRelatedCategoryProducts,
} from '@/lib/products/relatedCategoryProducts'
import { enrichProductTargetPests } from '@/lib/products/targetPests'
import { buildProductPageCtaBox } from '@/lib/products/productPageCtaBox'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import DownloadGate from '@/components/organisms/DownloadGate'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageStoryblok, StoryStoryblok, JobStoryblok } from '@/types/storyblok'
import localeConfig from '@/i18n/locales.json'
import { isDownloadGateContent, isNonRoutableComponent } from '@/lib/api/storyblok/routing'
import { mapStoryToDownloadGate } from '@/lib/downloadable/map'
import { tSafe } from '@/lib/i18n/tSafe'

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

  if (!story) {
    notFound()
  }

  if (isDownloadGateContent(story.content)) {
    const gate = mapStoryToDownloadGate(story, story.name)
    if (!gate) notFound()
    return <DownloadGate {...gate} />
  }

  if (isNonRoutableComponent(story.content?.component)) {
    notFound()
  }

  // Se il content è una Story, fetcha le story correlate + prodotti correlati
  if (story.content?.component === 'story') {

    const storyContent = story.content as StoryStoryblok
    const relatedStories = await getRelatedStoriesByTags(
      storyContent.tag,
      storySlug,
      locale
    )

    // Inietta le story correlate nel blok
    const nextContent: StoryStoryblok = {
      ...storyContent,
      ...(relatedStories.length > 0 ? { related_stories: relatedStories } : {}),
    }

    // Se il campo plugin related_products è configurato, risolvi i prodotti correlati
    const rawRelated = storyContent.related_products
    if (rawRelated) {
      // Normalizza i valori legacy: prima del fix il plugin poteva salvare variant
      // 'prodotto'/'story' nel campo related_products. Forza related_products.
      const normalizedRelated =
        typeof rawRelated === 'object' && rawRelated !== null
          ? { ...rawRelated, variant: 'related_products' }
          : rawRelated
      const parsed = parseCarouselVariant(normalizedRelated)
      const resolved = await resolveCarouselItems(parsed, locale)
      nextContent.related_products = {
        ...(typeof rawRelated === 'object' && rawRelated !== null
          ? rawRelated
          : {}),
        variant: parsed,
        resolved_items: resolved,
      }
    }

    story.content = nextContent
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
          const [relatedProjects, allProducts, , compareStories] = await Promise.all([
            getRelatedProjectsByProduct(story.uuid, locale),
            resolveProductStories(locale),
            enrichProductTargetPests(story.content, locale),
            getStoriesByComponent('compare', locale),
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

          // CTA box automatico: due card fisse e una card progetto opzionale.
          // Viene renderizzato dal Product prima dei carousel automatici.
          const t = await getTranslations({ locale })
          story.content.auto_cta_box = buildProductPageCtaBox(relatedProjects, {
            box1Title: tSafe(t, 'product_cta_box_1', 'Informa chi può trarne valore'),
            box2Title: tSafe(t, 'chiedi_supporto_esperto', 'Chiedi supporto a un nostro esperto'),
            copyLabel: tSafe(t, 'copy_link', 'Copia link'),
            contactLabel: tSafe(t, 'contact_us', 'Contattaci'),
            projectLabel: tSafe(t, 'scopri_progetto', 'Scopri il progetto'),
          })

          // Pagina confronto per il dettaglio prodotto.
          // 1. Preferenza: story `compare` del locale (pagina dedicata).
          // 2. Fallback: la listing prodotti — la pagina madre del prodotto
          //    (`it/prodotti/…` → `it/prodotti`). Nello spazio attuale non
          //    esiste ancora una story `compare`, quindi il bottone "Confronta"
          //    punta alla listing con i prodotti nei query params.
          const compareStory = (compareStories ?? [])[0]
          const listingFallbackSlug = getParentFullSlug(story.full_slug)
          const compareSlug = compareStory?.full_slug || listingFallbackSlug
          if (compareSlug) {
            const compareUrl = buildStoryblokNavigationHref(`/${compareSlug}`)
            if (compareUrl) {
              story.content.comparison_page_url = compareUrl
            }
          }

          // L'uuid della story serve a ProductStickyBar (download PDF + confronto).
          // StoryblokComponent passa solo il content: lo esponiamo sul blok.
          story.content.product_uuid = story.uuid
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

  if (isDownloadGateContent(story?.content)) {
    return {
      title: story?.name ? `${story.name} | Newpharm` : 'Newpharm',
      robots: { index: false, follow: true },
    }
  }

  if (isNonRoutableComponent(story?.content?.component)) {
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

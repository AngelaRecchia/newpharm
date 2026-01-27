import { getStory } from '@/lib/api/storyblok/stories'
import { getLangs } from '@/lib/api/storyblok/languages'
import StoryblokRenderer from '@/components/StoryblokRenderer'
import { getGlobalSettings } from '@/lib/api/settings'
import { GlobalSettingsProvider } from '@/lib/context/global-settings-context'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

/**
 * Generate static params for all available locales
 */
export async function generateStaticParams() {
  const locales = await getLangs()

  return locales.map((locale) => ({
    locale,
  }))
}

/**
 * Page per /layout-components senza header/footer
 * Questa route renderizza i componenti di layout direttamente
 */
export default async function LayoutComponentsPage({ params }: PageProps) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  // Carica i global settings per il context (ma non renderizza header/footer)
  const settings = await getGlobalSettings(locale)


  // Recupera la story per layout-components
  const story = await getStory('layout-components', locale)

  if (!story) {
    notFound()
  }

  return (
    <GlobalSettingsProvider settings={settings}>
      {story?.content && (
        <StoryblokRenderer blok={story.content} story={story} />
      )}
    </GlobalSettingsProvider>
  )

}

/**
 * Generate metadata with locale support for static rendering
 */
export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params

  // Pass locale to getTranslations for static rendering
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    title: 'Layout Components - Newpharm',
    description: 'Newpharm - Progetto Next.js con Storyblok',
  }
}

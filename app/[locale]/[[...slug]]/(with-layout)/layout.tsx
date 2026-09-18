import { ReactNode } from 'react'
import { getGlobalSettings } from '@/lib/api/settings'
import { GlobalSettingsProvider } from '@/lib/context/global-settings-context'
import Footer from '@/components/organisms/Footer'
import { getStory } from '@/lib/api/storyblok/stories'
import Header from '@/components/organisms/Header'
import { getHeaderVariantFromStoryContent } from '@/lib/storyblok/headerVariant'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{
    locale: string,
    slug?: string[]
  }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale, slug } = await params

  const storySlug = slug && slug.length > 0 ? slug.join('/') : ''
  const story = await getStory(storySlug, locale)

  // Carica i global settings una volta per locale (con caching)
  const settings = await getGlobalSettings(locale)

  const headerVariant = getHeaderVariantFromStoryContent(story?.content)



  return (
    <GlobalSettingsProvider settings={settings}>

      <div className='wrapper scroller'>
        {settings?.header.length > 0 && (
          <Header blok={settings?.header[0]} variant={headerVariant} />
        )}

        <main className='main'>
          {children}
        </main>

        {settings?.footer.length > 0 && (
          <Footer blok={settings?.footer[0]} />
        )}
      </div>

    </GlobalSettingsProvider>
  )
}

import { ReactNode } from 'react'
import { getGlobalSettings } from '@/lib/api/settings'
import { GlobalSettingsProvider } from '@/lib/context/global-settings-context'
import Footer from '@/components/organisms/Footer'
import { getStory } from '@/lib/api/storyblok/stories'
import { HeroStoryblok, PageStoryblok } from '@/types/storyblok'
import Header from '@/components/organisms/Header'

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


  // Carica i global settings una volta per locale (con caching)
  const settings = await getGlobalSettings(locale)

  // Costruisce lo slug per Storyblok (senza locale)
  const storySlug = slug && slug.length > 0 ? slug.join('/') : ''

  // Usa la funzione centralizzata per recuperare la story
  const story = await getStory(storySlug, locale)

  // Determina la variante dell'header in base al primo blocco del body
  let headerVariant: 'transparent' | 'white' = 'white'

  if (story?.content) {
    const pageContent = story.content as PageStoryblok

    // Controlla il primo blocco nel body
    if (pageContent.body && pageContent.body.length > 0) {
      const firstBlock = pageContent.body[0]
      headerVariant = getHeaderVariant(firstBlock)
    }
  }


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

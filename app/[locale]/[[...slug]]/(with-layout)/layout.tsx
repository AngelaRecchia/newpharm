import { ReactNode } from 'react'
import { getGlobalSettings } from '@/lib/api/settings'
import { GlobalSettingsProvider } from '@/lib/context/global-settings-context'
import Header from '@/components/organisms/Header'
import Footer from '@/components/organisms/Footer'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  // Carica i global settings una volta per locale (con caching)
  const settings = await getGlobalSettings(locale)


  return (
    <GlobalSettingsProvider settings={settings}>
      <div className='wrapper scroller'>
        {settings?.header.length > 0 && (
          <Header blok={settings?.header[0]} />
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

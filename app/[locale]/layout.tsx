import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/app.scss'
import { StoryblokProvider } from '@/lib/storyblok'
import { ViewportProvider } from '@/lib/context/viewport-context'
import { SmoothScrollProvider } from '@/lib/context/smooth-scroll-context'
import { IntlProvider } from '@/lib/intl-provider'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import localeConfig from '@/i18n/locales.json'

// Load Inter font with support for Latin and Arabic
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Newpharm',
  description: 'Newpharm - Progetto Next.js con Storyblok',
}

export function generateStaticParams() {
  return localeConfig.locales.map((locale) => ({ locale }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale against known locales
  if (!localeConfig.locales.includes(locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Get messages for the locale
  const messages = await getMessages()

  // Determine text direction based on locale
  const isRTL = locale === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body className={inter.className}>

        <StoryblokProvider>
          <IntlProvider locale={locale} messages={messages}>
            <ViewportProvider>
              <SmoothScrollProvider>{children}</SmoothScrollProvider>
            </ViewportProvider>
          </IntlProvider>
        </StoryblokProvider>

      </body>
    </html>
  )
}


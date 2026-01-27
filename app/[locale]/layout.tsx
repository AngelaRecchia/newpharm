import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/app.scss'
import { StoryblokProvider } from '@/lib/storyblok'
import { ViewportProvider } from '@/lib/context/viewport-context'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { getLangs } from '@/lib/api/storyblok/languages'

// Load Inter font with support for Latin and Arabic
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Storyblok + Next.js',
  description: 'Progetto Next.js con Storyblok e componenti Pixso',
}

export async function generateStaticParams() {
  const locales = await getLangs()
  return locales.map((locale) => ({ locale }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale against Storyblok locales
  const locales = await getLangs()
  if (!locales.includes(locale)) {
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
          <NextIntlClientProvider messages={messages}>
            <ViewportProvider>{children}</ViewportProvider>
          </NextIntlClientProvider>
        </StoryblokProvider>

      </body>
    </html>
  )
}


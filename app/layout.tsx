import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/app.scss'

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Newpharm',
  description: 'Newpharm - Progetto Next.js con Storyblok',
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="it">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import '@/app/app.scss'

export const metadata: Metadata = {
  title: 'Newpharm',
  description: 'Newpharm - Progetto Next.js con Storyblok',
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  // Il layout root non deve avere <html> e <body>
  // perché il layout locale ([locale]/layout.tsx) li gestisce
  return <>{children}</>
}

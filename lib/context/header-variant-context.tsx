'use client'

import { createContext, useContext, ReactNode, useState } from 'react'

type HeaderVariant = 'transparent' | 'white'

const HeaderVariantContext = createContext<{ variant: HeaderVariant, setVariant: (variant: HeaderVariant) => void } | null>(null)

export function HeaderVariantProvider({
  children,
  variant: initialVariant,
}: {
  children: ReactNode
  variant: HeaderVariant
}) {

  const [variant, setVariant] = useState<HeaderVariant>(initialVariant)

  return (
    <HeaderVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </HeaderVariantContext.Provider>
  )
}

export function useHeaderVariant(): HeaderVariant {
  const context = useContext(HeaderVariantContext)

  // Return default if context is null
  if (!context) {
    return 'white'
  }

  return context.variant
}

export function useSetHeaderVariant() {
  const context = useContext(HeaderVariantContext)

  if (!context) {
    return () => { } // No-op function if context is null
  }

  return context.setVariant
}

export function useHeaderVariantContext(): { variant: HeaderVariant, setVariant: (variant: HeaderVariant) => void } {
  const context = useContext(HeaderVariantContext)

  if (!context) {
    return {
      variant: 'white',
      setVariant: () => { }
    }
  }

  return context
}

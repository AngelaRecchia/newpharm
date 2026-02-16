'use client'

import { createContext, useContext, ReactNode } from 'react'

type HeaderVariant = 'transparent' | 'white'

const HeaderVariantContext = createContext<HeaderVariant | null>(null)

export function HeaderVariantProvider({
  children,
  variant,
}: {
  children: ReactNode
  variant: HeaderVariant
}) {
  return (
    <HeaderVariantContext.Provider value={variant}>
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

  return context
}

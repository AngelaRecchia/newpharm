'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { GlobalSettings } from '../api/settings'

const GlobalSettingsContext = createContext<GlobalSettings | null>(null)

export function GlobalSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode
  settings: GlobalSettings | null
}) {
  return (
    <GlobalSettingsContext.Provider value={settings}>
      {children}
    </GlobalSettingsContext.Provider>
  )
}

export function useGlobalSettings(): GlobalSettings {
  const context = useContext(GlobalSettingsContext)

  // Return default object if context is null
  if (!context) {
    return {
      locales: [],
    }
  }

  return context
}

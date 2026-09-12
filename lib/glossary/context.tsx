'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { GlossaryItem } from './types'

type GlossaryContextValue = {
  items: GlossaryItem[]
  open: (uid: string) => void
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null)

export function useGlossary() {
  return useContext(GlossaryContext)
}

export function GlossaryProvider({
  items,
  open,
  children,
}: {
  items: GlossaryItem[]
  open: (uid: string) => void
  children: ReactNode
}) {
  const value = useMemo(() => ({ items, open }), [items, open])
  return (
    <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>
  )
}

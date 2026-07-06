'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

/** Fallback allineato a --header-height in app.scss (4.25rem) */
export const DEFAULT_HEADER_HEIGHT_PX = 68

interface HeaderLayoutContextType {
  headerHeight: number
  setHeaderHeight: (height: number) => void
  firstBodyComponent: string | null
}

const HeaderLayoutContext = createContext<HeaderLayoutContextType>({
  headerHeight: DEFAULT_HEADER_HEIGHT_PX,
  setHeaderHeight: () => {},
  firstBodyComponent: null,
})

export function HeaderLayoutProvider({
  children,
  firstBodyComponent = null,
}: {
  children: ReactNode
  firstBodyComponent?: string | null
}) {
  const [headerHeight, setHeaderHeightState] = useState(DEFAULT_HEADER_HEIGHT_PX)

  const setHeaderHeight = useCallback((height: number) => {
    if (height <= 0) return

    setHeaderHeightState(height)
    document.documentElement.style.setProperty('--header-height', `${height}px`)
  }, [])

  return (
    <HeaderLayoutContext.Provider
      value={{ headerHeight, setHeaderHeight, firstBodyComponent }}
    >
      {children}
    </HeaderLayoutContext.Provider>
  )
}

export function useHeaderLayout() {
  return useContext(HeaderLayoutContext)
}

export function useIsFirstFullBanner() {
  const { firstBodyComponent } = useHeaderLayout()
  return firstBodyComponent === 'full_banner'
}

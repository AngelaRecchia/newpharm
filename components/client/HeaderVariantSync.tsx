'use client'

import { useSetHeaderVariant } from '@/lib/context/header-variant-context'
import { useLayoutEffect } from 'react'

interface HeaderVariantSyncProps {
  variant: 'transparent' | 'white'
}

export default function HeaderVariantSync({ variant }: HeaderVariantSyncProps) {
  const setVariant = useSetHeaderVariant()
  
  // useLayoutEffect viene eseguito prima del paint, quindi nessun jump visibile
  useLayoutEffect(() => {
    setVariant(variant)
  }, [variant, setVariant])

  return null
}

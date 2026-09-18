'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { GlossaryProvider } from '@/lib/glossary/context'
import type { PopupDetail } from '@/lib/link-action'
import type { GlossaryItem } from '@/lib/glossary/types'

const GlossaryDrawer = dynamic(() => import('@/components/organisms/GlossaryDrawer'))

export default function GlossaryRoot({
  items,
  children,
}: {
  items: GlossaryItem[]
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeUid, setActiveUid] = useState<string | null>(null)

  const open = useCallback((uid?: string) => {
    setActiveUid(uid ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    const onPopup = (event: Event) => {
      const detail = (event as CustomEvent<PopupDetail>).detail
      if (!detail?.popup) return
      if (detail.popup === 'glossario') {
        open()
        return
      }
      close()
    }

    window.addEventListener('newpharm:popup', onPopup)
    return () => window.removeEventListener('newpharm:popup', onPopup)
  }, [open, close])

  return (
    <GlossaryProvider items={items} open={open}>
      {children}
      {items.length > 0 ? (
        <GlossaryDrawer
          items={items}
          open={isOpen}
          activeUid={activeUid}
          onClose={close}
        />
      ) : null}
    </GlossaryProvider>
  )
}

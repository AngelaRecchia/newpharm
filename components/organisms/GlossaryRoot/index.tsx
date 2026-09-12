'use client'

import { useCallback, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { GlossaryProvider } from '@/lib/glossary/context'
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

  const open = useCallback((uid: string) => {
    setActiveUid(uid)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

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

'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { LinkPopupId, PopupDetail } from '@/lib/link-action'

const JobApplicationModal = dynamic(
  () => import('@/components/organisms/JobApplicationModal'),
)
const ContactModal = dynamic(
  () => import('@/components/organisms/ContactModal'),
)

export default function PopupRoot() {
  const [activePopup, setActivePopup] = useState<LinkPopupId | null>(null)
  const [jobTitle, setJobTitle] = useState<string | undefined>()

  const close = useCallback(() => {
    setActivePopup(null)
    setJobTitle(undefined)
  }, [])

  useEffect(() => {
    const onPopup = (event: Event) => {
      const detail = (event as CustomEvent<PopupDetail>).detail
      if (!detail?.popup) return
      setActivePopup(detail.popup)
      setJobTitle(detail.jobTitle)
    }

    window.addEventListener('newpharm:popup', onPopup)
    return () => window.removeEventListener('newpharm:popup', onPopup)
  }, [])

  return (
    <>
      <JobApplicationModal
        open={activePopup === 'job'}
        onClose={close}
        jobTitle={jobTitle}
      />
      <ContactModal
        open={activePopup === 'contattaci'}
        onClose={close}
      />
    </>
  )
}

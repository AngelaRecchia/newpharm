'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

function isMobileDevice() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  const isIpad =
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) ||
    /iPad/i.test(nav.userAgent)
  if (isIpad) return true
  if (typeof nav.userAgentData?.mobile === 'boolean') {
    return nav.userAgentData.mobile
  }
  return /Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    nav.userAgent,
  )
}

export function useCopyPageLink() {
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  const copyPageLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}`
    const shareData: ShareData = { title: document.title, url }

    if (
      isMobileDevice() &&
      typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [])

  return { copied, copyPageLink }
}

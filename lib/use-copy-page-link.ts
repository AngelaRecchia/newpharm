'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

function isMobileDevice() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  const ua = nav.userAgent || ''
  const isIpad =
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) ||
    /iPad/i.test(ua)
  if (isIpad) return true
  // Lo user agent è più affidabile di userAgentData.mobile === false
  // (Chrome desktop in device mode, alcuni tablet/foldable).
  if (/Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true
  }
  return nav.userAgentData?.mobile === true
}

async function tryNativeShare(url: string) {
  if (typeof navigator.share !== 'function') return false
  try {
    await navigator.share({ title: document.title, url })
    return true
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return true
    return false
  }
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

    if (isMobileDevice() && (await tryNativeShare(url))) return

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

'use client'

import { NextIntlClientProvider, IntlErrorCode } from 'next-intl'
import { ReactNode } from 'react'

const reportedMissing = new Set<string>()

function handleIntlError(error: any) {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    const key = error.message
    if (!reportedMissing.has(key)) {
      reportedMissing.add(key)
      console.warn(`[next-intl] ${key}`)
    }
    return
  }
  console.error(error)
}

function getMessageFallback({ namespace, key }: { namespace?: string; key: string; error: any }) {
  return namespace ? `${namespace}.${key}` : key
}

export function IntlProvider({ locale, messages, children }: { locale: string; messages: any; children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={handleIntlError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  )
}

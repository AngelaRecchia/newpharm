'use client'

import { forwardRef, useEffect, useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface RecaptchaSlotProps {
  className?: string
  /** Lingua widget (es. da `useLocale()` di next-intl) */
  locale?: string
  onTokenChange?: (token: string | null) => void
  /** es. aria-label per area widget reCAPTCHA */
  'aria-label'?: string
}

/**
 * Widget reCAPTCHA v2 (checkbox). Richiede `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
 * Usa `ref` per chiamare `.reset()` dopo errori o chiusura modale.
 */
const RecaptchaSlot = forwardRef<ReCAPTCHA, RecaptchaSlotProps>(
  (
    {
      className,
      locale,
      onTokenChange,
      'aria-label': ariaLabel = 'reCAPTCHA',
    },
    ref
  ) => {
    const [mounted, setMounted] = useState(false)
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()

    useEffect(() => {
      setMounted(true)
    }, [])

    if (!siteKey) {
      return null
    }

    if (!mounted) {
      return <div className={cn('loading')} aria-hidden />
    }

    return (
      <div
        className={cn('root', className)}
        role="region"
        aria-label={ariaLabel}
      >
        <ReCAPTCHA
          ref={ref}
          sitekey={siteKey}
          theme="dark"
          hl={locale}
          onChange={onTokenChange}
          onExpired={() => onTokenChange?.(null)}
          onErrored={() => onTokenChange?.(null)}
        />
      </div>
    )
  }
)

RecaptchaSlot.displayName = 'RecaptchaSlot'

export default RecaptchaSlot

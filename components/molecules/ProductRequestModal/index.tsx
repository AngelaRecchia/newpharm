'use client'

import { useCallback, useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import CheckboxField from '@/components/atoms/CheckboxField'
import RecaptchaSlot from '@/components/atoms/RecaptchaSlot'
import TextField from '@/components/atoms/TextField'
import Select from '@/components/molecules/Select'
import Modal from '@/components/molecules/Modal'
import { useLocale, useTranslations } from 'next-intl'
import { tSafe } from '@/lib/i18n/tSafe'
import { renderTermsMessage } from '@/lib/i18n/termsMessage'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ProductRequestModalProps {
  /** Titolo del prodotto di riferimento (mostrato come intro) */
  productTitle?: string
}

/**
 * Modale "Richiedi informazioni" del dettaglio prodotto.
 *
 * Form lead minimo: nome, cognome, email, settore, privacy + newsletter.
 * Invia a POST /api/leads/product (reCAPTCHA v2 se configurato).
 */
export default function ProductRequestModal({
  productTitle,
}: ProductRequestModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const requestInfoLabel = tSafe(t, 'request_info', 'Richiedi informazioni')
  const sendLabel = tSafe(t, 'request_submit', 'Invia richiesta')
  const successTitle = tSafe(t, 'request_success_title', 'Richiesta inviata')
  const successCopy = tSafe(
    t,
    'request_success_copy',
    'Ti ricontatteremo a breve per fornirti tutte le informazioni richieste.',
  )
  const genericError = tSafe(
    t,
    'request_error_generic',
    'Si è verificato un errore. Riprova più tardi.',
  )
  const networkError = tSafe(
    t,
    'request_error_network',
    'Errore di rete. Controlla la connessione e riprova.',
  )

  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [settore, setSettore] = useState('')
  const [terms, setTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const recaptchaEnabled = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim(),
  )

  const sectorOptions = [
    { value: 'cereali', label: t('cereali') },
    { value: 'industria_alimentare', label: t('industria_alimentare') },
    { value: 'zootecnia', label: t('zootecnia') },
    { value: 'pest_control', label: t('pest_control') },
  ]

  const resetForm = useCallback(() => {
    setNome('')
    setCognome('')
    setEmail('')
    setSettore('')
    setTerms(false)
    setNewsletter(false)
    setSubmitting(false)
    setRecaptchaToken(null)
    setRecaptchaError(false)
    setFormError(null)
    setSent(false)
    recaptchaRef.current?.reset()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!terms || !nome.trim() || !cognome.trim() || !email.trim()) return

    setRecaptchaError(false)
    setFormError(null)

    if (recaptchaEnabled && !recaptchaToken) {
      setRecaptchaError(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/leads/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome,
          surname: cognome,
          email,
          sector: settore || null,
          productTitle,
          recaptchaToken,
          acceptedTerms: terms,
          newsletter,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setFormError(data.error ?? 'unknown')
        recaptchaRef.current?.reset()
        setRecaptchaToken(null)
        setSubmitting(false)
        return
      }

      setSent(true)
      setSubmitting(false)
    } catch {
      setFormError('network')
      recaptchaRef.current?.reset()
      setRecaptchaToken(null)
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        label={requestInfoLabel}
        icon="right"
        iconAlwaysVisible
        onClick={() => {
          resetForm()
          setOpen(true)
        }}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={requestInfoLabel}
      >
        {sent ? (
          <div className={cn('success')}>
            <h2 className={cn('successTitle')}>{successTitle}</h2>
            <p className={cn('successCopy')}>{successCopy}</p>
          </div>
        ) : (
          <form className={cn('form')} onSubmit={handleSubmit}>
            <h2 className={cn('title')}>{requestInfoLabel}</h2>
            {productTitle ? (
              <p className={cn('intro')}>{productTitle}</p>
            ) : null}

            <div className={cn('row2')}>
              <TextField
                label={`${t('name')}*`}
                name="name"
                autoComplete="given-name"
                placeholder={t('your_name_here')}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              <TextField
                label={`${t('surname')}*`}
                name="surname"
                autoComplete="family-name"
                placeholder={t('your_surname_here')}
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                required
              />
            </div>

            <div className={cn('row2')}>
              <TextField
                label={`${t('email')}*`}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="esempio@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Select
                label={t('sector')}
                name="settore"
                value={settore}
                onChange={(e) => setSettore(e.target.value)}
                options={sectorOptions}
              />
            </div>

            <RecaptchaSlot
              ref={recaptchaRef}
              locale={locale}
              onTokenChange={(token) => {
                setRecaptchaToken(token)
                if (token) setRecaptchaError(false)
              }}
            />
            {recaptchaError ? (
              <p className={cn('error')} role="alert">
                {t('recaptcha_error')}
              </p>
            ) : null}

            {formError ? (
              <p className={cn('error')} role="alert">
                {formError === 'network' ? networkError : genericError}
              </p>
            ) : null}

            <CheckboxField
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              required
            >
              {renderTermsMessage(String(t.raw('accepts_terms')), '/termini')}
            </CheckboxField>
            <CheckboxField
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
            >
              {t('subscribe_to_newsletter')}
            </CheckboxField>

            <div className={cn('actions')}>
              <Button
                type="submit"
                label={sendLabel}
                icon="right-small"
                variant="primary"
                size="medium"
                disabled={submitting}
              />
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
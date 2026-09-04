'use client'

import { useCallback, useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import CheckboxField from '@/components/atoms/CheckboxField'
import RecaptchaSlot from '@/components/atoms/RecaptchaSlot'
import SmartLink from '@/components/atoms/SmartLink'
import TextField from '@/components/atoms/TextField'
import Select from '@/components/molecules/Select'
import { useLocale, useTranslations } from 'next-intl'
import { toAbsoluteHttpsUrl } from '@/lib/downloadable/assets'
import styles from './CatalogDownloadModal.module.scss'

const cn = classNames.bind(styles)

export type DownloadLeadFormProps = {
  fileUrl: string
  onSuccess?: () => void
}

export default function DownloadLeadForm({
  fileUrl,
  onSuccess,
}: DownloadLeadFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [settore, setSettore] = useState('')
  const [terms, setTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState(false)

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
    recaptchaRef.current?.reset()
  }, [])

  const startDownload = useCallback(() => {
    if (!fileUrl?.trim()) return
    window.open(toAbsoluteHttpsUrl(fileUrl), '_blank', 'noopener,noreferrer')
  }, [fileUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!terms || !nome.trim() || !cognome.trim() || !email.trim()) return

    setRecaptchaError(false)

    if (recaptchaEnabled && !recaptchaToken) {
      setRecaptchaError(true)
      return
    }

    setSubmitting(true)
    try {
      if (recaptchaEnabled && recaptchaToken) {
        const verifyRes = await fetch('/api/recaptcha/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken }),
        })
        const data = (await verifyRes.json()) as { success?: boolean }
        if (!verifyRes.ok || !data.success) {
          setRecaptchaError(true)
          recaptchaRef.current?.reset()
          setRecaptchaToken(null)
          return
        }
      }

      startDownload()
      onSuccess?.()
      if (!onSuccess) resetForm()
    } catch {
      setRecaptchaError(true)
      recaptchaRef.current?.reset()
      setRecaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={cn('form')} onSubmit={handleSubmit}>
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
          placeholder={t('select_sector')}
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
        <p className={cn('recaptchaError')} role="alert">
          {t('recaptcha_error')}
        </p>
      ) : null}

      <CheckboxField
        checked={terms}
        onChange={(e) => setTerms(e.target.checked)}
        required
      >
        {t.rich('accepts_terms', {
          a: (chunks) => <SmartLink href="/termini">{chunks}</SmartLink>,
        })}
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
          label={t('download')}
          icon="right-small"
          variant="primary"
          size="medium"
          disabled={submitting}
        />
      </div>
    </form>
  )
}

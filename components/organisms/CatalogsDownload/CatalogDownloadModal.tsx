'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import CheckboxField from '@/components/atoms/CheckboxField'
import RecaptchaSlot from '@/components/atoms/RecaptchaSlot'
import TextField from '@/components/atoms/TextField'
import Modal from '@/components/molecules/Modal'
import Select from '@/components/molecules/Select'
import styles from './CatalogDownloadModal.module.scss'
import { useLocale, useTranslations } from 'next-intl'
import SmartLink from '@/components/atoms/SmartLink'

const cn = classNames.bind(styles)



export interface CatalogDownloadModalProps {
  open: boolean
  fileUrl: string
  fileName: string
  /** Da Storyblok `catalog.short_description` */
  subtitle?: string
  onClose: () => void
}

export default function CatalogDownloadModal({
  open,
  fileUrl,
  fileName,
  subtitle,
  onClose,
}: CatalogDownloadModalProps) {

  const t = useTranslations()
  const locale = useLocale()
  const titleId = useId()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [settore, setSettore] = useState('')
  const [terms, setTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState(false)

  const recaptchaEnabled = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()
  )

  const SECTOR_OPTIONS = [
    { value: 'cereali', label: t('cereali') },
    { value: 'industria_alimentare', label: t('industria_alimentare') },
    { value: 'zootecnia', label: t('zootecnia') },
    { value: 'pest_control', label: t('pest_control') },
  ]


  useEffect(() => {
    if (open) return
    setNome('')
    setEmail('')
    setSettore('')
    setTerms(false)
    setNewsletter(false)
    setSubmitting(false)
    setRecaptchaToken(null)
    setRecaptchaError(false)
    recaptchaRef.current?.reset()
  }, [open])



  const startDownload = useCallback(() => {
    if (!fileUrl?.trim()) return
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }, [fileUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!terms || !nome.trim() || !email.trim()) return

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
      onClose()
      setNome('')
      setEmail('')
      setSettore('')
      setTerms(false)
      setNewsletter(false)
      setRecaptchaToken(null)
      recaptchaRef.current?.reset()
    } catch {
      setRecaptchaError(true)
      recaptchaRef.current?.reset()
      setRecaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabelledBy={titleId}
      initialFocusSelector="input"
    >
      <h2 id={titleId} className={cn('title')}>
        {t('download_selected_file')}
      </h2>
      <p className={cn('fileHint')}>{fileName}</p>
      {subtitle?.trim() ? (
        <p className={cn('subtitle')}>{subtitle.trim()}</p>
      ) : null}


      <form className={cn('form')} onSubmit={handleSubmit}>
        <div className={cn('row2')}>
          <TextField
            label={`${t('name')}*`}
            name="name"
            autoComplete="name"
            placeholder={t('your_name_here')}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
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
        </div>

        <Select
          label={t('sector')}
          name="settore"
          value={settore}
          onChange={(e) => setSettore(e.target.value)}
          placeholder={t('select_sector')}
          options={SECTOR_OPTIONS}
        />

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
            a: (chunks) => (
              <SmartLink href="/termini">{chunks}</SmartLink>
            ),
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
    </Modal>
  )
}

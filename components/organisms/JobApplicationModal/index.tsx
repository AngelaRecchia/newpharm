'use client'

import { useCallback, useId, useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import CheckboxField from '@/components/atoms/CheckboxField'
import RecaptchaSlot from '@/components/atoms/RecaptchaSlot'
import TextField from '@/components/atoms/TextField'
import Modal from '@/components/molecules/Modal'
import SmartLink from '@/components/atoms/SmartLink'
import FileUploadField from './FileUploadField'
import styles from './index.module.scss'
import { useLocale, useTranslations } from 'next-intl'

const cn = classNames.bind(styles)

export interface JobApplicationModalProps {
  open: boolean
  onClose: () => void
  jobTitle?: string
}

export default function JobApplicationModal({
  open,
  onClose,
  jobTitle,
}: JobApplicationModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const titleId = useId()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [messaggio, setMessaggio] = useState('')
  const [curriculum, setCurriculum] = useState<File | null>(null)
  const [terms, setTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState(false)

  const recaptchaEnabled = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim(),
  )

  const resetForm = useCallback(() => {
    setNome('')
    setCognome('')
    setEmail('')
    setTelefono('')
    setMessaggio('')
    setCurriculum(null)
    setTerms(false)
    setSubmitting(false)
    setRecaptchaToken(null)
    setRecaptchaError(false)
    recaptchaRef.current?.reset()
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !terms ||
      !nome.trim() ||
      !cognome.trim() ||
      !email.trim() ||
      !telefono.trim() ||
      !messaggio.trim() ||
      !curriculum
    ) {
      return
    }

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

      if (process.env.NODE_ENV !== 'production') {
        console.info('[JobApplicationModal] submit', {
          jobTitle,
          nome,
          cognome,
          email,
          telefono,
          messaggio,
          curriculum: curriculum.name,
        })
      }

      handleClose()
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
      onClose={handleClose}
      ariaLabelledBy={titleId}
      panelClassName={cn('panel')}
      initialFocusSelector="input"
    >
      <header className={cn('head')}>
        <div className={cn('headMain')}>
          <h2 id={titleId} className={cn('title')}>
            Candidatura spontanea
          </h2>
        </div>
        <p className={cn('intro')}>
          Il nostro team valuta con attenzione ogni candidatura spontanea.
          Compila il form e unisciti a noi.
        </p>
      </header>

      {jobTitle ? (
        <input type="hidden" name="job_title" value={jobTitle} readOnly />
      ) : null}

      <form className={cn('form')} onSubmit={handleSubmit}>
        <div className={cn('columns')}>
          <div className={cn('column')}>
            <TextField
              label="Nome*"
              name="nome"
              autoComplete="given-name"
              placeholder={t('your_name_here')}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <TextField
              label="Email*"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="esempio@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FileUploadField
              label="Curriculum*"
              value={curriculum}
              onChange={setCurriculum}
              required
            />
          </div>

          <div className={cn('column')}>
            <TextField
              label="Cognome*"
              name="cognome"
              autoComplete="family-name"
              placeholder="Il tuo cognome qui"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              required
            />
            <TextField
              label="Telefono*"
              type="tel"
              name="telefono"
              autoComplete="tel"
              placeholder="+00 333 00 222 50"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
            <label className={cn('textareaField')}>
              <span className={cn('textareaLabel')}>Messaggio*</span>
              <textarea
                className={cn('textarea')}
                name="messaggio"
                placeholder="Scrivi qui il tuo messaggio"
                value={messaggio}
                onChange={(e) => setMessaggio(e.target.value)}
                rows={5}
                required
              />
            </label>
          </div>
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
            a: (chunks) => (
              <SmartLink href="/termini">{chunks}</SmartLink>
            ),
          })}
        </CheckboxField>

        <div className={cn('actions')}>
          <Button
            type="submit"
            label="Invia candidatura"
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

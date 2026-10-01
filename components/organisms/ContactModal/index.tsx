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
import { COMPANY_TYPE_OPTIONS } from '@/lib/leads/companyTypes'
import { useLocale, useTranslations } from 'next-intl'
import { tSafe } from '@/lib/i18n/tSafe'
import { renderTermsMessage } from '@/lib/i18n/termsMessage'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const titleId = useId()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [vatOrTaxCode, setVatOrTaxCode] = useState('')
  const [companyType, setCompanyType] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [localita, setLocalita] = useState('')
  const [provincia, setProvincia] = useState('')
  const [cap, setCap] = useState('')
  const [stato, setStato] = useState('')
  const [azienda, setAzienda] = useState('')
  const [messaggio, setMessaggio] = useState('')
  const [terms, setTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const recaptchaEnabled = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim(),
  )

  const companyTypeOptions = COMPANY_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }))

  const successTitle = tSafe(
    t,
    'contact_success_title',
    'Richiesta inviata',
  )
  const successCopy = tSafe(
    t,
    'contact_success_copy',
    'Ti ricontatteremo al più presto.',
  )
  const genericError = tSafe(
    t,
    'contact_error_generic',
    'Si è verificato un errore. Riprova più tardi.',
  )
  const networkError = tSafe(
    t,
    'contact_error_network',
    'Errore di rete. Controlla la connessione e riprova.',
  )

  useEffect(() => {
    if (!open) {
      setRecaptchaReady(false)
      return
    }

    const timer = window.setTimeout(() => setRecaptchaReady(true), 280)
    return () => window.clearTimeout(timer)
  }, [open])

  const resetForm = useCallback(() => {
    setNome('')
    setCognome('')
    setTelefono('')
    setEmail('')
    setVatOrTaxCode('')
    setCompanyType('')
    setIndirizzo('')
    setLocalita('')
    setProvincia('')
    setCap('')
    setStato('')
    setAzienda('')
    setMessaggio('')
    setTerms(false)
    setNewsletter(false)
    setSubmitting(false)
    setRecaptchaToken(null)
    setRecaptchaError(false)
    setFormError(null)
    setSent(false)
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
      !telefono.trim() ||
      !email.trim() ||
      !vatOrTaxCode.trim() ||
      !companyType ||
      !indirizzo.trim() ||
      !localita.trim() ||
      !provincia.trim() ||
      !cap.trim() ||
      !stato.trim() ||
      !azienda.trim() ||
      !messaggio.trim()
    ) {
      return
    }

    setRecaptchaError(false)
    setFormError(null)

    if (recaptchaEnabled && !recaptchaToken) {
      setRecaptchaError(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/leads/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: nome,
          lastName: cognome,
          phone: telefono,
          email,
          vatOrTaxCode,
          companyType,
          address: indirizzo,
          city: localita,
          province: provincia,
          postalCode: cap,
          country: stato,
          companyName: azienda,
          message: messaggio,
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
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabelledBy={titleId}
      panelClassName={cn('panel')}
      initialFocusSelector="input"
    >
      {sent ? (
        <>
          <h2 id={titleId} className={cn('successTitle')}>
            {successTitle}
          </h2>
          <p className={cn('successCopy')}>{successCopy}</p>
          <Button
            type="button"
            label={tSafe(t, 'close', 'Chiudi')}
            variant="primary"
            size="medium"
            onClick={handleClose}
          />
        </>
      ) : (
        <>
          <header className={cn('head')}>
            <div className={cn('headMain')}>
              <h2 id={titleId} className={cn('title')}>
                Diventa un cliente Newpharm
              </h2>
            </div>
            <p className={cn('intro')}>
              Compila il form: il nostro team ti ricontatterà al più presto.
            </p>
          </header>

          <form className={cn('form')} onSubmit={handleSubmit}>
            <div className={cn('fieldGrid')}>
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
                label="Cognome*"
                name="cognome"
                autoComplete="family-name"
                placeholder={tSafe(
                  t,
                  'your_surname_here',
                  'Inserisci il cognome',
                )}
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                required
              />
              <TextField
                label="Telefono*"
                type="tel"
                name="telefono"
                autoComplete="tel"
                placeholder={tSafe(
                  t,
                  'phone_placeholder',
                  'Inserisci il telefono',
                )}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
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
              <TextField
                label="P.IVA/C.Fiscale*"
                name="vatOrTaxCode"
                value={vatOrTaxCode}
                onChange={(e) => setVatOrTaxCode(e.target.value)}
                required
              />
              <Select
                label="Tipologia azienda*"
                name="companyType"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                placeholder="Seleziona tipologia"
                options={companyTypeOptions}
                required
              />
              <TextField
                label="Indirizzo*"
                name="indirizzo"
                autoComplete="street-address"
                value={indirizzo}
                onChange={(e) => setIndirizzo(e.target.value)}
                required
              />
              <TextField
                label="Località*"
                name="localita"
                autoComplete="address-level2"
                value={localita}
                onChange={(e) => setLocalita(e.target.value)}
                required
              />
              <TextField
                label="Provincia*"
                name="provincia"
                autoComplete="address-level1"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                required
              />
              <TextField
                label="CAP*"
                name="cap"
                autoComplete="postal-code"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                required
              />
              <TextField
                label="Stato*"
                name="stato"
                autoComplete="country-name"
                value={stato}
                onChange={(e) => setStato(e.target.value)}
                required
              />
              <TextField
                label="Azienda / Ragione sociale*"
                name="azienda"
                autoComplete="organization"
                value={azienda}
                onChange={(e) => setAzienda(e.target.value)}
                required
              />

              <label className={cn('textareaField', 'fullWidth')}>
                <span className={cn('textareaLabel')}>Messaggio*</span>
                <textarea
                  className={cn('textarea')}
                  name="messaggio"
                  placeholder={tSafe(
                    t,
                    'message_placeholder',
                    'Scrivi il messaggio',
                  )}
                  value={messaggio}
                  onChange={(e) => setMessaggio(e.target.value)}
                  rows={3}
                  required
                />
              </label>
            </div>

            {recaptchaEnabled && recaptchaReady ? (
              <RecaptchaSlot
                key="contact-modal-recaptcha"
                ref={recaptchaRef}
                locale={locale}
                onTokenChange={(token) => {
                  setRecaptchaToken(token)
                  if (token) setRecaptchaError(false)
                }}
              />
            ) : recaptchaEnabled ? (
              <div className={cn('recaptchaPlaceholder')} aria-hidden />
            ) : null}
            {recaptchaError ? (
              <p className={cn('recaptchaError')} role="alert">
                {t('recaptcha_error')}
              </p>
            ) : null}

            {formError ? (
              <p className={cn('formError')} role="alert">
                {formError === 'network' ? networkError : genericError}
              </p>
            ) : null}

            <div className={cn('checkboxGroup')}>
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
            </div>

            <div className={cn('actions')}>
              <Button
                type="submit"
                label="Invia"
                icon="right-small"
                variant="primary"
                size="medium"
                disabled={submitting}
              />
            </div>
          </form>
        </>
      )}
    </Modal>
  )
}

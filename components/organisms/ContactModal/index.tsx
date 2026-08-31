'use client'

import { useCallback, useId, useState } from 'react'
import classNames from 'classnames/bind'
import Button from '@/components/atoms/Button'
import TextField from '@/components/atoms/TextField'
import Modal from '@/components/molecules/Modal'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const titleId = useId()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [messaggio, setMessaggio] = useState('')

  const handleClose = useCallback(() => {
    setNome('')
    setEmail('')
    setMessaggio('')
    onClose()
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !messaggio.trim()) return

    if (process.env.NODE_ENV !== 'production') {
      console.info('[ContactModal] submit', { nome, email, messaggio })
    }

    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabelledBy={titleId}
      initialFocusSelector="input"
    >
      <h2 id={titleId} className={cn('title')}>
        Contattaci
      </h2>
      <p className={cn('intro')}>
        Scrivici: ti risponderemo il prima possibile.
      </p>

      <form className={cn('form')} onSubmit={handleSubmit}>
        <TextField
          label="Nome*"
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <TextField
          label="Email*"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className={cn('textareaField')}>
          <span className={cn('textareaLabel')}>Messaggio*</span>
          <textarea
            className={cn('textarea')}
            name="messaggio"
            value={messaggio}
            onChange={(e) => setMessaggio(e.target.value)}
            rows={4}
            required
          />
        </label>
        <Button type="submit" label="Invia" variant="primary" size="medium" />
      </form>
    </Modal>
  )
}

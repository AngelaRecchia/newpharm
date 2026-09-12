'use client'

import { useId } from 'react'
import classNames from 'classnames/bind'
import Modal from '@/components/molecules/Modal'
import { useTranslations } from 'next-intl'
import DownloadLeadForm from './DownloadLeadForm'
import styles from './CatalogDownloadModal.module.scss'

const cn = classNames.bind(styles)

export interface CatalogDownloadModalProps {
  open: boolean
  fileUrl: string
  fileName: string
  /** Da Storyblok `short_description` del catalogo */
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
  const titleId = useId()

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

      {open ? (
        <DownloadLeadForm fileUrl={fileUrl} onSuccess={onClose} />
      ) : null}
    </Modal>
  )
}

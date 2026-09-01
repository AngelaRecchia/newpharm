'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import classNames from 'classnames/bind'
import { useTranslations } from 'next-intl'
import Button from '@/components/atoms/Button'
import Modal from '@/components/molecules/Modal'
import type { AssetStoryblok } from '@/types/storyblok'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

const SWIPE_PX = 40

/** Larghezza sufficiente per contain a 2x, senza scaricare l’originale Storyblok. */
const GALLERY_WIDTH = 1920

function gallerySrc(filename: string) {
  if (!filename || /\.svg(\?|$)/i.test(filename)) return filename
  const base = filename.split('?')[0].replace(/\/m\/.*$/, '')
  return `${base}/m/${GALLERY_WIDTH}x0/filters:format(webp)`
}

type InsectGalleryModalProps = {
  open: boolean
  onClose: () => void
  title: string
  images: AssetStoryblok[]
}

export default function InsectGalleryModal({
  open,
  onClose,
  title,
  images,
}: InsectGalleryModalProps) {
  const t = useTranslations('')
  const [index, setIndex] = useState(0)
  const total = images.length
  const rawCloseLabel = t('close_overlay')
  const closeLabel =
    rawCloseLabel === 'close_overlay' ? 'Chiudi scheda' : rawCloseLabel
  const canNavigate = total > 1
  const swipeRef = useRef({ pointerId: -1, x: 0, y: 0, active: false })

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  const goPrev = useCallback(() => {
    setIndex((value) => (total === 0 ? 0 : (value - 1 + total) % total))
  }, [total])

  const goNext = useCallback(() => {
    setIndex((value) => (total === 0 ? 0 : (value + 1) % total))
  }, [total])

  useEffect(() => {
    if (!open || !canNavigate) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, canNavigate, goPrev, goNext])

  const hasImage = images.some((image) => image.filename)

  const onSwipeStart = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canNavigate || event.button !== 0) return
      swipeRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        active: true,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [canNavigate],
  )

  const onSwipeEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current
      if (!swipe.active || swipe.pointerId !== event.pointerId) return
      swipe.active = false
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      const dx = event.clientX - swipe.x
      const dy = event.clientY - swipe.y
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) goNext()
      else goPrev()
    },
    [goNext, goPrev],
  )

  const onSwipeCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (swipeRef.current.pointerId !== event.pointerId) return
    swipeRef.current.active = false
  }, [])

  return (
    <Modal
      open={open}
      onClose={onClose}
      plain
      centered
      multiply
      hideCloseButton
      ariaLabel={title || closeLabel}
      backdropClassName={cn('backdrop')}
      panelClassName={cn('panel')}
    >
      <div className={cn('frame')}>
        {hasImage ? (
          <div
            className={cn('stage')}
            onPointerDown={onSwipeStart}
            onPointerUp={onSwipeEnd}
            onPointerCancel={onSwipeCancel}
          >
            {images.map((image, i) =>
              image.filename ? (
                <img
                  key={`${image.id ?? image.filename}-${i}`}
                  className={cn('photo', { isCurrent: i === index })}
                  src={gallerySrc(image.filename)}
                  alt={i === index ? image.alt || title : ''}
                  decoding="async"
                  draggable={false}
                />
              ) : null,
            )}
          </div>
        ) : (
          <p className={cn('empty')}>Nessuna immagine</p>
        )}
        <div className={cn('nav')}>
          <Button
            type="button"
            icon="chevron-left"
            variant="tertiary"
            weight="normal"
            animated
            disabled={!canNavigate}
            aria-label="Immagine precedente"
            onClick={goPrev}
          />
          <button type="button" className={cn('close')} onClick={onClose}>
            {closeLabel}
          </button>
          <Button
            type="button"
            icon="chevron-right"
            variant="tertiary"
            weight="normal"
            animated
            aria-label="Immagine successiva"
            disabled={!canNavigate}
            onClick={goNext}
          />
        </div>
      </div>
    </Modal>
  )
}

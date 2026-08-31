'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import classNames from 'classnames/bind'
import Icon from '@/components/atoms/Icon'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

export type FileUploadProps = {
  label: ReactNode
  hint: ReactNode
  value: File | null
  onChange: (file: File | null) => void
  required?: boolean
  accept?: string
}

export default function FileUpload({
  label,
  hint,
  value,
  onChange,
  required,
  accept = '.pdf,.doc,.docx',
}: FileUploadProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null
    onChange(file)
  }

  return (
    <div className={cn('field')}>
      <span className={cn('label')}>{label}</span>
      <div
        className={cn('control', { dragOver, hasFile: Boolean(value) })}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          className={cn('input')}
          accept={accept}
          required={required && !value}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Icon type="upload" size="m" weight="normal" className={cn('icon')} />
        {value ? (
          <span className={cn('fileName')}>{value.name}</span>
        ) : (
          <span className={cn('hint')}>{hint}</span>
        )}
      </div>
    </div>
  )
}

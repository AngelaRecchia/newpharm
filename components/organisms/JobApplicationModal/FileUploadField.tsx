'use client'

import { useId, useRef, useState } from 'react'
import classNames from 'classnames/bind'
import styles from './FileUploadField.module.scss'

const cn = classNames.bind(styles)

export type FileUploadFieldProps = {
  label: string
  value: File | null
  onChange: (file: File | null) => void
  required?: boolean
  accept?: string
}

export default function FileUploadField({
  label,
  value,
  onChange,
  required,
  accept = '.pdf,.doc,.docx',
}: FileUploadFieldProps) {
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
        className={cn('dropzone', { dragOver, hasFile: Boolean(value) })}
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
        {value ? (
          <span className={cn('fileName')}>{value.name}</span>
        ) : (
          <span className={cn('hint')}>
            Drag your file(s) or <span className={cn('browse')}>browse</span>
          </span>
        )}
      </div>
    </div>
  )
}

import React from 'react'

export function renderTextWithBreaks(text: string): React.ReactNode {
  if (!text.includes('\n')) return text

  const parts = text.split('\n')
  return parts.flatMap((part, index) =>
    index < parts.length - 1
      ? [part, React.createElement('br', { key: `br-${index}` })]
      : [part],
  )
}

'use client'

import { Fragment, useCallback, useMemo, type MouseEvent, type ReactNode } from 'react'
import { useGlossary } from '@/lib/glossary/context'
import { buildGlossaryMatcher } from '@/lib/glossary/match'
import styles from './index.module.scss'

export function GlossaryTermButton({
  uid,
  children,
}: {
  uid: string
  children: ReactNode
}) {
  const glossary = useGlossary()

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    glossary?.open(uid)
  }

  return (
    <button type="button" className={styles.term} onClick={onClick}>
      {children}
    </button>
  )
}

export function useGlossaryHighlight() {
  const glossary = useGlossary()
  const items = glossary?.items
  const open = glossary?.open
  const matcher = useMemo(
    () => (items && items.length > 0 ? buildGlossaryMatcher(items) : null),
    [items],
  )

  return useCallback(
    (text: string): ReactNode => {
      if (!text || !matcher || !open) return text
      const hits = matcher(text)
      if (
        hits.length === 0 ||
        (hits.length === 1 && hits[0].type === 'text')
      ) {
        return text
      }

      return hits.map((hit, index) =>
        hit.type === 'text' ? (
          <Fragment key={`text-${index}`}>{hit.value}</Fragment>
        ) : (
          <GlossaryTermButton key={`${hit.uid}-${index}`} uid={hit.uid}>
            {hit.value}
          </GlossaryTermButton>
        ),
      )
    },
    [matcher, open],
  )
}

export default function GlossaryText({ text }: { text?: string | null }) {
  const highlight = useGlossaryHighlight()
  if (!text) return null
  return <>{highlight(text)}</>
}

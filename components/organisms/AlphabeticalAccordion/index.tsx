'use client'

import { useMemo } from 'react'
import classNames from 'classnames/bind'
import styles from './index.module.scss'
import type { Accordion_itemStoryblok, Alphabetical_accordionStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'
import AccordionItem from '@/components/atoms/AccordionItem'
import RichText from '@/components/organisms/RichText'
import { getStoryblokAnchorId } from '@/lib/storyblok/anchor'

const cn = classNames.bind(styles)

type LetterGroup = {
  letter: string
  items: Accordion_itemStoryblok[]
}

function letterOf(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '#'
  const first = trimmed
    .charAt(0)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
  if (first >= 'A' && first <= 'Z') return first
  return '#'
}

function groupItemsByLetter(items: Accordion_itemStoryblok[]): LetterGroup[] {
  const map = new Map<string, Accordion_itemStoryblok[]>()

  for (const item of items) {
    const letter = letterOf(item.title || '')
    const list = map.get(letter)
    if (list) list.push(item)
    else map.set(letter, [item])
  }

  for (const list of map.values()) {
    list.sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'it', { sensitivity: 'base' }),
    )
  }

  return [...map.keys()]
    .sort((a, b) => {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })
    .map((letter) => ({ letter, items: map.get(letter)! }))
}

const AlphabeticalAccordion = ({ blok }: { blok: Alphabetical_accordionStoryblok }) => {
  const groups = useMemo(
    () => groupItemsByLetter((blok.items ?? []) as Accordion_itemStoryblok[]),
    [blok.items],
  )

  if (groups.length === 0) return null

  return (
    <section
      className={cn('wrapper')}
      id={getStoryblokAnchorId(blok.anchor_id)}
      {...storyblokEditable(blok as any)}
    >
      <div className={cn('groups')}>
        {groups.map((group) => (
          <div
            key={group.letter}
            id={`${blok._uid}-letter-${group.letter}`}
            className={cn('group')}
          >
            <h3 className={cn('groupLetter')}>{group.letter}</h3>
            <div className={cn('items')}>
              {group.items.map((item) => (
                <AccordionItem
                  key={item._uid}
                  label={item.title || ''}
                  variant="secondary"
                >
                  <RichText content={item.text} raw enableGlossary />
                </AccordionItem>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AlphabeticalAccordion

import type { ISbRichtext } from '@storyblok/react'

export type GlossaryItem = {
  uid: string
  term: string
  aliases: string[]
  definition: ISbRichtext | null
}

'use server'

import { parseCarouselVariant } from './parseCarouselVariant'
import { resolveCarouselItems } from './resolveCarouselItems'
import type { ListingStoryResolved } from '@/lib/listing/types'

export async function resolveCarouselItemsAction(
  rawVariant: unknown,
  locale: string,
): Promise<ListingStoryResolved[]> {
  const parsed = parseCarouselVariant(rawVariant)
  return resolveCarouselItems(parsed, locale)
}

import type { ListingCardData } from '@/lib/listing/types'
import type { Full_bannerStoryblok } from '@/types/storyblok'

export const INSECT_PAGE_SIZE = 16
export const CARDS_PER_BANNER = 8
export const MAX_BANNERS = 3

export type InfestantiGridItem =
  | { type: 'card'; card: ListingCardData; index: number }
  | { type: 'banner'; banner: Full_bannerStoryblok; index: number }

export function interleaveInfestantiPage(
  cards: ListingCardData[],
  banners: Full_bannerStoryblok[],
  page: number,
  pageSize = INSECT_PAGE_SIZE,
  cardsPerBanner = CARDS_PER_BANNER,
): InfestantiGridItem[] {
  const start = (page - 1) * pageSize
  const pageCards = cards.slice(start, start + pageSize)
  const limitedBanners = banners.slice(0, MAX_BANNERS)
  const items: InfestantiGridItem[] = []

  pageCards.forEach((card, offset) => {
    const globalIndex = start + offset
    items.push({ type: 'card', card, index: globalIndex })

    const globalCount = globalIndex + 1
    if (globalCount % cardsPerBanner !== 0) return

    const bannerIdx = globalCount / cardsPerBanner - 1
    const banner = limitedBanners[bannerIdx]
    if (!banner) return

    items.push({ type: 'banner', banner, index: bannerIdx })
  })

  return items
}

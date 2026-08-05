import type { ListingContentComponent, ListingStoryResolved } from './types'
import { mapCatalogStoryToCard } from './mapCatalogToCard'
import { mapProductStoryToCard } from './mapProductToCard'
import { mapStubStoryToCard } from './mapStubToCard'

export function mapStoryToCard(
  story: ListingStoryResolved,
  component: ListingContentComponent,
) {
  switch (component) {
    case 'product':
      return mapProductStoryToCard(story)
    case 'catalog':
      return mapCatalogStoryToCard(story)
    case 'project':
    case 'insect':
      return mapStubStoryToCard(story)
    default:
      return mapStubStoryToCard(story)
  }
}

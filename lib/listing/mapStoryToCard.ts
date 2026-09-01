import type { ListingContentComponent, ListingStoryResolved } from './types'
import { mapCatalogStoryToCard } from './mapCatalogToCard'
import { mapInsectStoryToCard } from './mapInsectToCard'
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
    case 'insect':
      return mapInsectStoryToCard(story)
    case 'project':
      return mapStubStoryToCard(story)
    default:
      return mapStubStoryToCard(story)
  }
}

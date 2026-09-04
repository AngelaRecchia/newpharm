import type { ListingContentComponent, ListingStoryResolved } from './types'
import { mapCatalogStoryToCard } from './mapCatalogToCard'
import { mapInsectStoryToCard } from './mapInsectToCard'
import { mapProductStoryToCard } from './mapProductToCard'
import { mapStubStoryToCard } from './mapStubToCard'

export function mapStoryToCard(
  story: ListingStoryResolved,
  component: ListingContentComponent,
) {
  const storyComponent =
    typeof story.content.component === 'string'
      ? story.content.component
      : component

  switch (storyComponent) {
    case 'product':
      return mapProductStoryToCard(story)
    case 'catalog':
    case 'downloadable':
      return mapCatalogStoryToCard(story)
    case 'insect':
      return mapInsectStoryToCard(story)
    case 'project':
      return mapStubStoryToCard(story)
    default:
      return mapStubStoryToCard(story)
  }
}

import { hasRichTextContent } from '@/lib/api/utils/richtext'
import { getProductCategorySlug } from '@/lib/product-filtri'
import type { ProductFiltriValue } from '@/lib/product-filtri'
import type { ListingStoryResolved } from '@/lib/listing/types'
import type { AssetStoryblok, LinkStoryblok, ProductStoryblok } from '@/types/storyblok'
import type { ISbRichtext } from '@storyblok/react'

export type CompareProductView = {
  uuid: string
  title: string
  href: string
  image: AssetStoryblok | null
  shortDescription?: string
  category: string | null
  applicationAreasText?: ISbRichtext
  composition?: ISbRichtext
  dosage?: ISbRichtext
  unitsPerCarton?: ISbRichtext
  safetySheetHref?: string
  resources: LinkStoryblok[]
}

function firstImage(images: unknown): AssetStoryblok | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  if (first && typeof first === 'object' && 'filename' in first) {
    return first as AssetStoryblok
  }
  return null
}

export function mapProductStoryToCompare(story: ListingStoryResolved): CompareProductView {
  const content = story.content as unknown as ProductStoryblok & {
    category?: unknown
    product_filtri?: ProductFiltriValue
  }
  const safetySheet = content.safety_data_sheet

  return {
    uuid: story.uuid,
    title: content.title || story.name,
    href: `/${story.full_slug}`,
    image: firstImage(content.images),
    shortDescription: content.short_description || undefined,
    category: getProductCategorySlug(content.product_filtri, content.category) ?? null,
    applicationAreasText: content.application_areas_text as ISbRichtext | undefined,
    composition: content.composition ?? undefined,
    dosage: content.dosage_and_application as ISbRichtext | undefined,
    unitsPerCarton: content.units_per_carton as ISbRichtext | undefined,
    safetySheetHref: safetySheet?.filename || undefined,
    resources: Array.isArray(content.resources) ? content.resources : [],
  }
}

export function mapProductStoriesToCompare(
  stories: ListingStoryResolved[],
): CompareProductView[] {
  return stories.map(mapProductStoryToCompare)
}

export function hasCompareResources(product: CompareProductView): boolean {
  return product.resources.length > 0
}

export function hasCompareRichtext(content?: ISbRichtext | null): boolean {
  if (!content) return false
  return hasRichTextContent(content)
}

export function getCompareOptionsForSlot(
  allProducts: CompareProductView[],
  slotIndex: 0 | 1,
  selected: [CompareProductView | null, CompareProductView | null],
): CompareProductView[] {
  const other = selected[1 - slotIndex]
  const pool = other?.category
    ? allProducts.filter(
        (product) =>
          product.category === other.category && product.uuid !== other.uuid,
      )
    : allProducts

  return pool
}

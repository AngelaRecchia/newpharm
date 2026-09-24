import { parseCarouselVariant } from '@/lib/carousel/parseCarouselVariant'
import {
  resolveCarouselItems,
  resolveRelatedProductsVariant,
} from '@/lib/carousel/resolveCarouselItems'
import {
  resolveListingProductItems,
  resolveListingRefItems,
} from '@/lib/listing/resolveListingItems'
import { parseListingVariant } from '@/lib/listing/parseListingVariant'
import { enrichProductTargetPests } from '@/lib/products/targetPests'
import {
  asPluginValue,
  type PluginResolveRequest,
  type PluginResolveResult,
} from '@/lib/preview/pluginLiveResolve'

export async function resolvePluginRequest(
  request: PluginResolveRequest,
  locale?: string,
): Promise<PluginResolveResult> {
  switch (request.kind) {
    case 'carousel': {
      const parsed = parseCarouselVariant(asPluginValue(request.variant))
      return { resolved_items: await resolveCarouselItems(parsed, locale) }
    }
    case 'listing': {
      const parsed = parseListingVariant(asPluginValue(request.variant))
      const resolved_items =
        parsed.variant === 'prodotto'
          ? await resolveListingProductItems(parsed, locale)
          : await resolveListingRefItems(parsed, locale)
      return { resolved_items }
    }
    case 'related_products': {
      const pluginValue = asPluginValue(request.variant)
      const raw =
        pluginValue && typeof pluginValue === 'object'
          ? { ...(pluginValue as Record<string, unknown>), variant: 'related_products' }
          : pluginValue
      const parsed = parseCarouselVariant(raw)
      const resolved_items = request.unlimited
        ? await resolveRelatedProductsVariant(parsed, locale)
        : await resolveCarouselItems(parsed, locale)
      return { resolved_items }
    }
    case 'target_pests': {
      const content: Record<string, unknown> = {
        target_pests: asPluginValue(request.target_pests),
      }
      await enrichProductTargetPests(content, locale)
      return {
        resolved_target_pests: Array.isArray(content.resolved_target_pests)
          ? content.resolved_target_pests
          : [],
      }
    }
  }
}

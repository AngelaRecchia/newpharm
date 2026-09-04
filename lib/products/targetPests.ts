import { getStoriesByUuids, type Story } from '@/lib/api/storyblok/stories'
import { parsePestFamily, type PestFamily } from '@/lib/insects/families'
import type { ListingStoryResolved } from '@/lib/listing/types'
import type { InsectStoryblok, InsectStoryResolved } from '@/types/storyblok'

export type TargetPestView = {
  uid: string
  title: string
  family: PestFamily | null
  text?: string
}

export type TargetPestsPluginItem = {
  uuid: string
  text?: string
}

export type TargetPestsPluginValue = {
  items: TargetPestsPluginItem[]
}

function getInsectBlok(raw: unknown): InsectStoryblok | null {
  if (!raw || typeof raw === 'string') return null

  if (typeof raw === 'object' && 'content' in raw && raw.content) {
    const content = (raw as InsectStoryResolved).content
    if (content?.component === 'insect' || content?.title) return content
  }

  const direct = raw as InsectStoryblok
  if (direct?.component === 'insect' || direct?.title) return direct
  return null
}

function insectUuidFromLegacy(raw: unknown): string | null {
  if (typeof raw === 'string' && raw) return raw
  if (raw && typeof raw === 'object' && 'uuid' in raw) {
    const uuid = (raw as { uuid?: unknown }).uuid
    if (typeof uuid === 'string' && uuid) return uuid
  }
  return null
}

export function parseTargetPestsValue(raw: unknown): TargetPestsPluginItem[] {
  if (!raw) return []

  if (typeof raw === 'object' && !Array.isArray(raw) && 'items' in raw) {
    const items = (raw as { items?: unknown }).items
    if (!Array.isArray(items)) return []
    return items.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const record = item as { uuid?: unknown; text?: unknown }
      if (typeof record.uuid !== 'string' || !record.uuid) return []
      const text = typeof record.text === 'string' ? record.text.trim() : ''
      return [{ uuid: record.uuid, text: text || undefined }]
    })
  }

  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const blok = item as { insect?: unknown; text?: unknown }
    const uuid = insectUuidFromLegacy(blok.insect)
    if (!uuid) return []
    const text = typeof blok.text === 'string' ? blok.text.trim() : ''
    return [{ uuid, text: text || undefined }]
  })
}

function viewFromInsect(
  uid: string,
  insect: InsectStoryblok,
  text?: string,
): TargetPestView {
  return {
    uid,
    title: insect.title,
    family: parsePestFamily(insect.famiglia),
    text,
  }
}

function viewFromStory(item: TargetPestsPluginItem, story: Story | undefined): TargetPestView | null {
  if (!story?.content) return null
  const insect = story.content as InsectStoryblok
  if (!insect.title && insect.component !== 'insect') return null
  return viewFromInsect(item.uuid, insect, item.text)
}

/** Mapping da campo CMS (plugin JSON, bloks legacy, o view già risolte). */
export function mapTargetPests(items: unknown): TargetPestView[] {
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0]
    if (first && typeof first === 'object' && 'title' in first && 'uid' in first) {
      return items as TargetPestView[]
    }
  }

  if (!Array.isArray(items)) return []

  const out: TargetPestView[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const blok = item as { _uid?: unknown; insect?: unknown; text?: unknown }
    const insect = getInsectBlok(blok.insect)
    if (!insect) continue
    const text = typeof blok.text === 'string' ? blok.text.trim() : ''
    out.push(
      viewFromInsect(
        typeof blok._uid === 'string' ? blok._uid : insect.title,
        insect,
        text || undefined,
      ),
    )
  }
  return out
}

export async function enrichProductTargetPests(
  content: Record<string, unknown> | null | undefined,
  locale?: string,
): Promise<void> {
  if (!content) return
  const items = parseTargetPestsValue(content.target_pests)
  if (items.length === 0) {
    content.resolved_target_pests = []
    return
  }

  const stories = await getStoriesByUuids(
    items.map((item) => item.uuid),
    locale,
  )
  const byUuid = new Map(stories.map((story) => [story.uuid, story]))
  content.resolved_target_pests = items
    .map((item) => viewFromStory(item, byUuid.get(item.uuid)))
    .filter((view): view is TargetPestView => view !== null)
}

export async function enrichProductsTargetPests(
  products: ListingStoryResolved[],
  locale?: string,
): Promise<void> {
  const uuids = [
    ...new Set(
      products.flatMap((product) =>
        parseTargetPestsValue(product.content.target_pests).map((item) => item.uuid),
      ),
    ),
  ]
  if (uuids.length === 0) {
    for (const product of products) {
      product.content.resolved_target_pests = []
    }
    return
  }

  const stories = await getStoriesByUuids(uuids, locale)
  const byUuid = new Map(stories.map((story) => [story.uuid, story]))

  for (const product of products) {
    const items = parseTargetPestsValue(product.content.target_pests)
    product.content.resolved_target_pests = items
      .map((item) => viewFromStory(item, byUuid.get(item.uuid)))
      .filter((view): view is TargetPestView => view !== null)
  }
}

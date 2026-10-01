import { getStoriesByUuids, type Story } from '@/lib/api/storyblok/stories'
import { readInsectFamily, type TargetPestFamilyView } from '@/lib/insects/family'
import type { ListingStoryResolved } from '@/lib/listing/types'
import type {
  InsectFamilyStoryblok,
  InsectStoryblok,
  InsectStoryResolved,
} from '@/types/storyblok'

export type { TargetPestFamilyView }

export type TargetPestsPluginKind = 'insect' | 'family'

export type TargetPestView = {
  uid: string
  title: string
  scientificName?: string
  family: TargetPestFamilyView | null
  familyOnly?: boolean
}

function readScientificName(insect: InsectStoryblok): string | undefined {
  const value = insect.nome_scientifico?.trim()
  return value || undefined
}

/** Etichetta tra parentesi in scheda prodotto: nome scientifico, altrimenti titolo. */
export function targetPestParentheticalLabel(item: TargetPestView): string {
  if (item.familyOnly) {
    return item.family?.title?.trim() || item.title
  }
  return item.scientificName?.trim() || item.title
}

export type TargetPestsPluginItem = {
  kind: TargetPestsPluginKind
  uuid: string
}

export type TargetPestsPluginValue = {
  items: TargetPestsPluginItem[]
}

function parseKind(value: unknown): TargetPestsPluginKind {
  if (value === 'family') return 'family'
  return 'insect'
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
      const record = item as { uuid?: unknown; kind?: unknown }
      if (typeof record.uuid !== 'string' || !record.uuid) return []
      return [{ kind: parseKind(record.kind), uuid: record.uuid }]
    })
  }

  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const blok = item as { insect?: unknown }
    const uuid = insectUuidFromLegacy(blok.insect)
    if (!uuid) return []
    return [{ kind: 'insect' as const, uuid }]
  })
}

function viewFromInsect(uid: string, insect: InsectStoryblok): TargetPestView {
  return {
    uid,
    title: insect.title,
    scientificName: readScientificName(insect),
    family: readInsectFamily(insect.famiglia),
    familyOnly: false,
  }
}

function viewFromFamilyStory(uid: string, story: Story): TargetPestView | null {
  const family = readInsectFamily(story)
  if (!family) return null
  return {
    uid,
    title: family.title,
    family,
    familyOnly: true,
  }
}

function viewFromStory(
  item: TargetPestsPluginItem,
  story: Story | undefined,
): TargetPestView | null {
  if (!story?.content) return null

  if (item.kind === 'family') {
    return viewFromFamilyStory(item.uuid, story)
  }

  const content = story.content as InsectStoryblok | InsectFamilyStoryblok
  if (content.component === 'insect_family') {
    return viewFromFamilyStory(item.uuid, story)
  }

  const insect = content as InsectStoryblok
  if (!insect.title && insect.component !== 'insect') return null
  return viewFromInsect(item.uuid, insect)
}

/** Mapping da campo CMS (plugin JSON, bloks legacy, o view già risolte). */
export function mapTargetPests(items: unknown): TargetPestView[] {
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0]
    if (first && typeof first === 'object' && 'title' in first && 'uid' in first) {
      return items.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const record = item as Partial<TargetPestView> & { famiglia?: unknown }
        if (typeof record.uid !== 'string' || typeof record.title !== 'string') return []
        const familyOnly = record.familyOnly === true
        return [{
          uid: record.uid,
          title: record.title,
          scientificName:
            typeof record.scientificName === 'string'
              ? record.scientificName.trim() || undefined
              : undefined,
          family: readInsectFamily(record.family ?? record.famiglia),
          familyOnly,
        }]
      })
    }
  }

  if (!Array.isArray(items)) return []

  const out: TargetPestView[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const blok = item as { _uid?: unknown; insect?: unknown }
    const insect = getInsectBlok(blok.insect)
    if (!insect) continue
    out.push(
      viewFromInsect(
        typeof blok._uid === 'string' ? blok._uid : insect.title,
        insect,
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

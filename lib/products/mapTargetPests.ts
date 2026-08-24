import type {
  AssetStoryblok,
  InsectStoryblok,
  InsectStoryResolved,
  Target_pest_itemStoryblok,
} from '@/types/storyblok'

export type TargetPestView = {
  uid: string
  title: string
  image: AssetStoryblok | null
  text?: string
}

function isAsset(value: unknown): value is AssetStoryblok {
  return (
    !!value &&
    typeof value === 'object' &&
    'filename' in value &&
    typeof (value as { filename?: unknown }).filename === 'string' &&
    (value as { filename: string }).filename.length > 0
  )
}

function insectImage(image: unknown): AssetStoryblok | null {
  if (isAsset(image)) return image
  if (Array.isArray(image) && isAsset(image[0])) return image[0]
  return null
}

function getInsectBlok(
  raw: Target_pest_itemStoryblok['insect'],
): InsectStoryblok | null {
  if (!raw || typeof raw === 'string') return null

  if (typeof raw === 'object' && 'content' in raw && raw.content) {
    const content = (raw as InsectStoryResolved).content
    if (content?.component === 'insect' || content?.title) return content
  }

  const direct = raw as InsectStoryblok
  if (direct?.component === 'insect' || direct?.title) return direct
  return null
}

export function mapTargetPests(items: unknown): TargetPestView[] {
  if (!Array.isArray(items)) return []

  const out: TargetPestView[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const blok = item as Target_pest_itemStoryblok
    const insect = getInsectBlok(blok.insect)
    if (!insect) continue

    const text = typeof blok.text === 'string' ? blok.text.trim() : ''
    out.push({
      uid: blok._uid,
      title: insect.title,
      image: insectImage(insect.image),
      text: text || undefined,
    })
  }
  return out
}

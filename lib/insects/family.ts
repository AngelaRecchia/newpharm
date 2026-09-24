/** Famiglia infestante risolta da una story `insect_family`. */
export type TargetPestFamilyView = {
  uid: string
  title: string
  iconUrl: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function iconFilename(icon: unknown): string | null {
  if (!isRecord(icon)) return null
  const filename = icon.filename
  return typeof filename === 'string' && filename.trim() ? filename.trim() : null
}

function asFamilyView(raw: Record<string, unknown>): TargetPestFamilyView | null {
  if (typeof raw.uid !== 'string' || typeof raw.title !== 'string' || !raw.title.trim()) {
    return null
  }
  if (!('iconUrl' in raw)) return null
  const iconUrl = typeof raw.iconUrl === 'string' && raw.iconUrl.trim() ? raw.iconUrl.trim() : null
  return { uid: raw.uid, title: raw.title.trim(), iconUrl }
}

/**
 * Legge una famiglia da story risolta (`resolve_relations`) o da una view già mappata.
 * Uno slug legacy non ha più icona né titolo in codice.
 */
export function readInsectFamily(raw: unknown): TargetPestFamilyView | null {
  if (!isRecord(raw)) return null

  const view = asFamilyView(raw)
  if (view) return view

  const content = isRecord(raw.content) ? raw.content : raw
  if (content.component && content.component !== 'insect_family') return null

  const uid = typeof raw.uuid === 'string' ? raw.uuid : null
  const titleFromContent = typeof content.title === 'string' ? content.title.trim() : ''
  const titleFromName = typeof raw.name === 'string' ? raw.name.trim() : ''
  const title = titleFromContent || titleFromName
  if (!uid || !title) return null

  return {
    uid,
    title,
    iconUrl: iconFilename(content.icon),
  }
}

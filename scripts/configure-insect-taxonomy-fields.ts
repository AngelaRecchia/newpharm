/**
 * Allinea la tassonomia infestanti su Storyblok.
 *
 * - Macro categorie: select fisso su `insect.category`
 * - Famiglie: content type `insect_family` (titolo + icona), una story per locale
 * - `insect.famiglia` diventa un riferimento UUID a quella story
 *
 * Idempotente. Icone iniziali da `public/icons/pests/{slug}.svg|.png`.
 *
 * Uso: npm run configure:insect-taxonomy
 */

import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

import localeConfig from '@/i18n/locales.json'
import { INSECT_MACRO_CATEGORIES, storyblokOptions } from '@/lib/insects/taxonomy'

/** Seed iniziale: le famiglie che prima vivevano in codice. */
const FAMILY_SEED = [
  { value: 'zanzare', label: 'Zanzare' },
  { value: 'mosche', label: 'Mosche' },
  { value: 'vespe', label: 'Vespe' },
  { value: 'calabroni', label: 'Calabroni' },
  { value: 'formiche', label: 'Formiche' },
  { value: 'blatte', label: 'Blatte' },
  { value: 'pesciolini_d_argento', label: "Pesciolini d'argento" },
  { value: 'termiti', label: 'Termiti' },
  { value: 'tarli_cerambicidi', label: 'Tarli cerambicidi' },
  { value: 'tarli_siricidi', label: 'Tarli siricidi' },
  { value: 'cimici_dei_letti', label: 'Cimici dei letti' },
  { value: 'cimici', label: 'Cimici' },
  { value: 'zecche', label: 'Zeche' },
  { value: 'pulci', label: 'Pulci' },
  { value: 'pidocchi', label: 'Pidocchi' },
  { value: 'acari', label: 'Acari' },
  { value: 'acaro_pollino', label: 'Acaro pollino' },
  { value: 'tarme', label: 'Tarme' },
  { value: 'coleottero_dei_tappeti', label: 'Coleottero dei tappeti' },
  { value: 'ratto_grigio', label: 'Ratto grigio' },
  { value: 'ratto_nero', label: 'Ratto nero' },
  { value: 'topolino_domestico', label: 'Topolino domestico' },
  { value: 'piccioni', label: 'Piccioni' },
  { value: 'insetti_delle_derrate', label: 'Insetti delle derrate' },
] as const

const FAMILY_SLUGS = new Set<string>(FAMILY_SEED.map((item) => item.value))

/** Valori già salvati sulle schede insect prima del riferimento. */
const FAMILY_ALIASES: Record<string, string> = {
  blatta: 'blatte',
  mosca: 'mosche',
  vespa: 'vespe',
  zanzara: 'zanzare',
  formica: 'formiche',
  calabrone: 'calabroni',
  scarafaggio: 'blatte',
  scarafaggi: 'blatte',
  pesciolini_dargento: 'pesciolini_d_argento',
  "pesciolini_d'argento": 'pesciolini_d_argento',
  termite: 'termiti',
  cimice: 'cimici',
  pulce: 'pulci',
  pidocchio: 'pidocchi',
  acaro: 'acari',
  tignola: 'tarme',
  zecca: 'zecche',
  piccione: 'piccioni',
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons', 'pests')
const DATA_FOLDER_SLUG = 'data'
const FAMILY_FOLDER_SLUG = 'insect-families'
const ROOT_LOCALE = ''

function familyStoryFullSlug(locale: string, familySlug: string): string {
  return [locale, DATA_FOLDER_SLUG, FAMILY_FOLDER_SLUG, familySlug].filter(Boolean).join('/')
}

type MgmtStory = {
  id: number
  uuid: string
  name: string
  slug: string
  full_slug: string
  parent_id: number | null
  is_folder?: boolean
  content?: Record<string, unknown>
}

type MgmtComponent = {
  id: number
  name: string
  display_name?: string
  is_root?: boolean
  is_nestable?: boolean
  schema?: Record<string, Record<string, unknown>>
}

type AssetRef = {
  id: number
  alt: string
  name: string
  focus: string
  title: string
  filename: string
  copyright: string
  fieldtype: 'asset'
}

type SignedAsset = {
  id: number
  post_url?: string
  fields?: Record<string, string>
  pretty_url?: string
  filename?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function familySlugFromLegacy(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim() || UUID_RE.test(raw.trim())) return null
  const normalized = raw.trim().toLocaleLowerCase('it-IT').replace(/\s+/g, '_')
  if (FAMILY_SLUGS.has(normalized)) return normalized
  return FAMILY_ALIASES[normalized] ?? null
}

function iconFilenameOf(content: Record<string, unknown> | undefined): string | null {
  const icon = content?.icon
  if (!isRecord(icon)) return null
  return typeof icon.filename === 'string' && icon.filename.trim() ? icon.filename : null
}

function assetRefFromContent(content: Record<string, unknown> | undefined): AssetRef | null {
  const icon = content?.icon
  if (!isRecord(icon) || typeof icon.filename !== 'string' || !icon.filename.trim()) return null
  return {
    id: typeof icon.id === 'number' ? icon.id : 0,
    alt: typeof icon.alt === 'string' ? icon.alt : '',
    name: typeof icon.name === 'string' ? icon.name : '',
    focus: typeof icon.focus === 'string' ? icon.focus : '',
    title: typeof icon.title === 'string' ? icon.title : '',
    filename: icon.filename,
    copyright: typeof icon.copyright === 'string' ? icon.copyright : '',
    fieldtype: 'asset',
  }
}

function localeOf(fullSlug: string, locales: readonly string[]): string {
  const first = fullSlug.split('/').filter(Boolean)[0] ?? ''
  return locales.includes(first) ? first : ROOT_LOCALE
}

function localIconPath(slug: string): string | null {
  for (const ext of ['svg', 'png']) {
    const filePath = path.join(ICONS_DIR, `${slug}.${ext}`)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

async function main() {
  loadEnv({ path: '.env.local' })

  const spaceId = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID
  const managementToken = process.env.STORYBLOK_MANAGEMENT_TOKEN

  if (!spaceId || !managementToken) {
    console.error(
      'Servono NEXT_PUBLIC_STORYBLOK_SPACE_ID e STORYBLOK_MANAGEMENT_TOKEN in .env.local',
    )
    process.exit(1)
  }

  const root = `https://mapi.storyblok.com/v1/spaces/${spaceId}`
  const headers = {
    Authorization: managementToken,
    'Content-Type': 'application/json',
  }

  async function request(url: string, init?: RequestInit, attempt = 0): Promise<Response> {
    const response = await fetch(url, init)
    if (response.status === 429 && attempt < 5) {
      const retryAfter = Number(response.headers.get('retry-after') ?? 0)
      await sleep((retryAfter || attempt + 1) * 1000)
      return request(url, init, attempt + 1)
    }
    return response
  }

  async function readJson<T>(response: Response, label: string): Promise<T> {
    if (!response.ok) {
      throw new Error(`${label} (${response.status}): ${await response.text()}`)
    }
    return (await response.json()) as T
  }

  async function listStories(query: Record<string, string>): Promise<MgmtStory[]> {
    const stories: MgmtStory[] = []
    let page = 1

    while (true) {
      const params = new URLSearchParams({ per_page: '100', page: String(page), ...query })
      const response = await request(`${root}/stories?${params}`, { headers })
      const data = await readJson<{ stories?: MgmtStory[] }>(response, 'Elenco stories')
      const batch = data.stories ?? []
      stories.push(...batch)
      if (batch.length < 100) break
      page += 1
    }

    return stories
  }

  async function getStory(id: number): Promise<MgmtStory> {
    const response = await request(`${root}/stories/${id}`, { headers })
    const data = await readJson<{ story: MgmtStory }>(response, `Lettura story ${id}`)
    return data.story
  }

  async function listComponents(): Promise<MgmtComponent[]> {
    const response = await request(`${root}/components`, { headers })
    const data = await readJson<{ components?: MgmtComponent[] }>(response, 'Elenco componenti')
    return data.components ?? []
  }

  async function saveComponent(component: MgmtComponent): Promise<void> {
    const response = await request(`${root}/components/${component.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ component }),
    })
    await readJson(response, `Aggiornamento componente ${component.name}`)
  }

  const familySchema = {
    title: {
      type: 'text',
      pos: 0,
      required: true,
      translatable: true,
      display_name: 'Titolo',
    },
    icon: {
      type: 'asset',
      pos: 1,
      required: false,
      translatable: false,
      filetypes: ['images'],
      display_name: 'Icona',
      description:
        'Sagoma monocromatica (SVG o PNG). In scheda prodotto viene colorata come il testo.',
    },
  }

  const components = await listComponents()
  let familyComponent = components.find((item) => item.name === 'insect_family')

  if (!familyComponent) {
    const response = await request(`${root}/components`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        component: {
          name: 'insect_family',
          display_name: 'Famiglia infestante',
          is_root: true,
          is_nestable: false,
          schema: familySchema,
        },
      }),
    })
    const created = await readJson<{ component: MgmtComponent }>(
      response,
      'Creazione insect_family',
    )
    familyComponent = created.component
    console.log('Content type insect_family creato.')
  } else {
    const schema = { ...(familyComponent.schema ?? {}) }
    let changed = false
    if (!schema.title) {
      schema.title = familySchema.title
      changed = true
    }
    if (!schema.icon) {
      schema.icon = familySchema.icon
      changed = true
    }
    if (changed) {
      familyComponent = { ...familyComponent, schema }
      await saveComponent(familyComponent)
      console.log('Schema insect_family completato con titolo e icona.')
    } else {
      console.log('Content type insect_family già presente.')
    }
  }

  const uploaded = new Map<string, AssetRef>()

  async function uploadIcon(slug: string): Promise<AssetRef | null> {
    const cached = uploaded.get(slug)
    if (cached) return cached

    const filePath = localIconPath(slug)
    if (!filePath) {
      console.warn(`[icona] Nessun file per ${slug} in public/icons/pests`)
      return null
    }

    const filename = path.basename(filePath)
    const bytes = fs.readFileSync(filePath)
    const signResponse = await request(`${root}/assets/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filename, size: String(bytes.byteLength) }),
    })
    const signedRaw = await readJson<SignedAsset & { asset?: SignedAsset }>(
      signResponse,
      `Firma upload ${filename}`,
    )
    const signed = signedRaw.asset ?? signedRaw
    if (!signed.id || !signed.post_url || !signed.fields) {
      throw new Error(`Risposta upload incompleta per ${filename}`)
    }

    const form = new FormData()
    for (const [key, value] of Object.entries(signed.fields)) {
      if (key === 'file') continue
      form.append(key, String(value))
    }
    form.append('file', new Blob([bytes]), filename)

    const uploadResponse = await request(signed.post_url, { method: 'POST', body: form })
    if (!uploadResponse.ok) {
      throw new Error(`Upload ${filename} (${uploadResponse.status}): ${await uploadResponse.text()}`)
    }

    const finishResponse = await request(`${root}/assets/${signed.id}/finish_upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    })
    if (!finishResponse.ok && finishResponse.status !== 404) {
      console.warn(
        `[icona] finish_upload ${filename} (${finishResponse.status}): ${await finishResponse.text()}`,
      )
    }

    const filenameUrl = signed.pretty_url || signed.filename
    if (!filenameUrl) {
      throw new Error(`URL asset mancante per ${filename}`)
    }

    const asset: AssetRef = {
      id: signed.id,
      alt: '',
      name: filename,
      focus: '',
      title: '',
      filename: filenameUrl,
      copyright: '',
      fieldtype: 'asset',
    }
    uploaded.set(slug, asset)
    console.log(`[icona] ${slug} caricata`)
    return asset
  }

  const locales = localeConfig.locales
  const folders = (await listStories({ folder_only: '1' })).map((folder) => ({
    ...folder,
    is_folder: true,
  }))
  const familyStories = await listStories({ contain_component: 'insect_family' })

  function findFolder(parentId: number | null, slug: string): MgmtStory | undefined {
    return folders.find((folder) => {
      const sameParent = (folder.parent_id ?? 0) === (parentId ?? 0)
      return folder.is_folder && folder.slug === slug && sameParent
    })
  }

  async function ensureFolder(
    parentId: number | null,
    slug: string,
    name: string,
    defaultRoot: string | null = 'insect_family',
  ): Promise<MgmtStory> {
    const existing = findFolder(parentId, slug)
    if (existing) return existing

    const story: Record<string, unknown> = {
      name,
      slug,
      is_folder: true,
      parent_id: parentId ?? 0,
    }
    if (defaultRoot) story.default_root = defaultRoot

    const response = await request(`${root}/stories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ story }),
    })
    const created = await readJson<{ story: MgmtStory }>(response, `Cartella ${slug}`)
    folders.push({ ...created.story, is_folder: true })
    console.log(`Cartella ${created.story.full_slug} creata.`)
    return created.story
  }

  const localeFolderId = new Map<string, number | null>()
  const presentLocales = locales.filter((locale) => findFolder(null, locale) || findFolder(0, locale))

  if (presentLocales.length === 0) {
    localeFolderId.set(ROOT_LOCALE, null)
    console.log('Nessuna cartella lingua in root: le famiglie vanno in /data/insect-families.')
  } else {
    for (const locale of presentLocales) {
      const folder = findFolder(null, locale) ?? findFolder(0, locale)
      localeFolderId.set(locale, folder?.id ?? null)
    }
  }

  async function moveFolder(folder: MgmtStory, parentId: number): Promise<void> {
    const response = await request(`${root}/stories/${folder.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        force_update: 1,
        story: {
          name: folder.name,
          slug: folder.slug,
          is_folder: true,
          parent_id: parentId,
        },
      }),
    })
    await readJson(response, `Spostamento cartella ${folder.full_slug}`)
    folder.parent_id = parentId
  }

  const familyUuidByLocale = new Map<string, Map<string, string>>()

  for (const [locale, parentId] of localeFolderId) {
    const dataFolder = await ensureFolder(parentId, DATA_FOLDER_SLUG, 'Data', null)

    const legacyFolder = findFolder(parentId, FAMILY_FOLDER_SLUG)
    if (legacyFolder) {
      const oldPrefix = legacyFolder.full_slug
      await moveFolder(legacyFolder, dataFolder.id)
      const newPrefix = [locale, DATA_FOLDER_SLUG, FAMILY_FOLDER_SLUG].filter(Boolean).join('/')
      legacyFolder.full_slug = newPrefix
      for (const story of familyStories) {
        if (story.full_slug === oldPrefix || story.full_slug.startsWith(`${oldPrefix}/`)) {
          story.full_slug = newPrefix + story.full_slug.slice(oldPrefix.length)
          story.parent_id = legacyFolder.id
        }
      }
      console.log(`Cartella spostata: ${oldPrefix} → ${newPrefix}`)
    }

    const familiesFolder = await ensureFolder(
      dataFolder.id,
      FAMILY_FOLDER_SLUG,
      'Famiglie infestanti',
    )
    const bySlug = new Map<string, string>()

    for (const family of FAMILY_SEED) {
      const fullSlug = familyStoryFullSlug(locale, family.value)
      const listed = familyStories.find((story) => story.full_slug === fullSlug)
      const existing = listed?.content ? listed : listed ? await getStory(listed.id) : undefined
      const existingAsset = assetRefFromContent(existing?.content)
      if (existingAsset) uploaded.set(family.value, existingAsset)

      const asset = existingAsset ?? (await uploadIcon(family.value))
      const content: Record<string, unknown> = {
        ...(existing?.content ?? {}),
        component: 'insect_family',
        title:
          typeof existing?.content?.title === 'string' && existing.content.title.trim()
            ? existing.content.title
            : family.label,
      }
      if (asset) content.icon = asset

      if (existing) {
        const needsIcon = Boolean(asset) && !iconFilenameOf(existing.content)
        const needsTitle = typeof existing.content?.title !== 'string' || !existing.content.title.trim()
        if (needsIcon || needsTitle || existing.content?.component !== 'insect_family') {
          const response = await request(`${root}/stories/${existing.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              publish: 1,
              story: {
                name: existing.name || family.label,
                slug: existing.slug,
                parent_id: existing.parent_id ?? familiesFolder.id,
                content,
              },
            }),
          })
          await readJson(response, `Aggiornamento ${fullSlug}`)
          console.log(`Famiglia aggiornata: ${fullSlug}`)
        }
        bySlug.set(family.value, existing.uuid)
        continue
      }

      const response = await request(`${root}/stories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          publish: 1,
          story: {
            name: family.label,
            slug: family.value,
            parent_id: familiesFolder.id,
            content,
          },
        }),
      })
      const created = await readJson<{ story: MgmtStory }>(response, `Creazione ${fullSlug}`)
      familyStories.push(created.story)
      bySlug.set(family.value, created.story.uuid)
      console.log(`Famiglia creata: ${created.story.full_slug}`)
    }

    familyUuidByLocale.set(locale, bySlug)
  }

  const insectComponent = components.find((item) => item.name === 'insect')
  if (!insectComponent?.schema) {
    throw new Error('Componente insect non trovato.')
  }

  const categoryField = insectComponent.schema.category
  const famigliaField = insectComponent.schema.famiglia
  const famigliaPos = Number(famigliaField?.pos ?? Object.keys(insectComponent.schema).length)
  const preservedFamiglia = { ...(famigliaField ?? {}) }
  delete preservedFamiglia.options
  delete preservedFamiglia.datasource_slug

  const insectSchema = {
    ...insectComponent.schema,
    category: {
      ...(categoryField ?? {}),
      type: 'option',
      display_name: 'Macro categoria',
      description: 'Macro categoria Guida infestanti (es. insetti volanti, roditori…).',
      options: storyblokOptions(INSECT_MACRO_CATEGORIES),
    },
    famiglia: {
      ...preservedFamiglia,
      type: 'option',
      pos: famigliaPos,
      source: 'internal_stories',
      filter_content_type: ['insect_family'],
      use_uuid: true,
      translatable: false,
      required: false,
      display_name: 'Famiglia / gruppo',
      description:
        'Riferimento alla famiglia infestante (titolo e icona). Raggruppa i target pest in scheda prodotto.',
    },
  }

  await saveComponent({ ...insectComponent, schema: insectSchema })
  console.log('insect.famiglia è un riferimento a insect_family.')

  const insects = await listStories({ contain_component: 'insect' })
  let migrated = 0

  for (const insect of insects) {
    if (insect.is_folder) continue
    const locale = localeOf(insect.full_slug, locales)
    const familyIds = familyUuidByLocale.get(locale) ?? familyUuidByLocale.get(ROOT_LOCALE)
    if (!familyIds) {
      console.warn(`[insect] Nessuna famiglia per ${insect.full_slug}`)
      continue
    }

    const content = insect.content ?? (await getStory(insect.id)).content
    if (!content) {
      console.warn(`[insect] Contenuto assente: ${insect.full_slug}`)
      continue
    }

    const current = content.famiglia
    if (typeof current === 'string' && UUID_RE.test(current.trim())) continue

    const slug = familySlugFromLegacy(current)
    if (!current) continue
    if (!slug) {
      console.warn(`[insect] Famiglia non riconosciuta su ${insect.full_slug}: ${String(current)}`)
      continue
    }

    const uuid = familyIds.get(slug)
    if (!uuid) {
      console.warn(`[insect] UUID famiglia mancante (${locale}/${slug}) per ${insect.full_slug}`)
      continue
    }

    const response = await request(`${root}/stories/${insect.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        publish: 1,
        story: {
          name: insect.name,
          slug: insect.slug,
          parent_id: insect.parent_id ?? 0,
          content: { ...content, famiglia: uuid },
        },
      }),
    })
    await readJson(response, `Migrazione ${insect.full_slug}`)
    migrated += 1
    console.log(`[insect] ${insect.full_slug} → ${slug}`)
  }

  console.log(`Migrazione completata: ${migrated} schede insect aggiornate.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

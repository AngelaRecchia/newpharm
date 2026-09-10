import type { AssetStoryblok, ProductStoryblok } from '@/types/storyblok'
import type { ISbRichtext } from '@storyblok/react'
import { mapTargetPests, type TargetPestView } from '@/lib/products/targetPests'
import { getAssetSrc } from '@/lib/assets/getAssetSrc'

/**
 * Modello dati della scheda tecnica PDF.
 * Campo per campo -> sezione del template (fedele al PDF di esempio).
 */

export type SheetSectionKind =
  | 'characteristics'
  | 'application'
  | 'dosage'
  | 'composition'
  | 'units'
  | 'targetPests'
  | 'specifications'

export type SheetSection = {
  kind: SheetSectionKind
  /** Etichetta tradotta (dal template: "Caratteristiche", "Campi d'impiego"...). */
  label: string
  /** Body della sezione: testo o lista di testi. */
  body: string | string[] | TargetPestView[]
}

export type TechnicalSheetData = {
  /** UUID prodotto (Storyblok). */
  uuid: string
  /** Timestamp dell'ultima modifica della story, usato per versionare la cache. */
  sourceUpdatedAt?: string
  /** Slug/i18n della categoria ("accessori-roditori", "monitoraggio"...). */
  categorySlug?: string
  /** Nome prodotto (titolo). */
  title: string
  /** Sottotitolo (2 righe nel template). */
  subtitle?: string
  /**
 * Prima immagine prodotto — nel template c'è l'immagine (flacone, trappola...).
 * Può essere un URL diretto (react-pdf lo scarica) o un buffer già risolto
 * `{ data: Buffer, format: 'png'|'jpg' }` (evita fetch a runtime).
 */
  image?: string | { data: Buffer; format: 'png' | 'jpg' } | null
  /** Riepilogo breve (paragrafo iniziale sotto l'header). */
  summary?: string
  /** Sezioni della scheda (tutte opzionali: presenti solo se il contenuto c'è). */
  sections: SheetSection[]
  /** Registrazione/simbologia (es. "Reg. PMC: 21329", "GHS07, GHS09"). */
  registration?: string
  /** Footer: info legali azienda. */
  footerCompany: string
  /** Footer: data aggiornamento (localizzata). */
  footerUpdated: string
  /** Locale della scheda (per metadata PDF). */
  locale: string
}

/** Prefissi etichetta per sezioni — ereditate dal template. */
const DEFAULT_LABELS: Record<SheetSectionKind, string> = {
  characteristics: 'Caratteristiche',
  application: "Campi d'impiego",
  dosage: 'Dosi e modalità d\'uso',
  composition: 'Composizione',
  units: 'PZ/cartone',
  targetPests: 'Target bersaglio',
  specifications: 'Specifiche',
}

/**
 * Estrae testo puro da un nodo richtext Storyblok (ignora marks/glossario).
 * Usato per piattire i richtext nel PDF — il PDF non ha bisogno di markdown.
 */
function richtextToPlainText(
  content: ISbRichtext | string | null | undefined,
): string {
  if (!content) return ''
  if (typeof content === 'string') return content

  const parts: string[] = []

  const walk = (nodes: unknown[] | undefined): void => {
    if (!nodes) return
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const record = node as { type?: string; text?: string; content?: unknown[] }
      if (typeof record.text === 'string' && record.text) {
        parts.push(record.text)
      } else if (Array.isArray(record.content)) {
        walk(record.content)
      }
    }
  }

  walk(content.content)
  return parts.join('')
}

/**
 * Mappa una story prodotto Storyblok → modello scheda tecnica.
 * I campi sono opzionali: la scheda mostra solo le sezioni con contenuto.
 */
export function mapProductToSheet(
  story: { uuid: string; name: string; updated_at?: string; content: ProductStoryblok },
  opts: {
    categorySlug?: string
    labels?: Partial<Record<SheetSectionKind, string>>
    footerCompany?: string
    footerUpdated?: string
    locale?: string
  },
): TechnicalSheetData {
  const content = story.content
  const labels = { ...DEFAULT_LABELS, ...(opts.labels ?? {}) }

  const sections: SheetSection[] = []

  const addPlainSection = (
    kind: SheetSectionKind,
    value: unknown,
    transformer?: (v: string) => string,
  ): void => {
    const raw = typeof value === 'string' ? value : richtextToPlainText(value as ISbRichtext)
    const text = (raw ?? '').trim()
    if (!text) return
    sections.push({ kind, label: labels[kind], body: transformer ? transformer(text) : text })
  }

  // Caratteristiche: nel template è il paragrafo iniziale sotto l'header.
  addPlainSection('characteristics', content.features)

  // Campi d'impiego.
  addPlainSection('application', content.application_areas_text)

  // Dosi e modalità d'uso (nel template è un blocco unico con dosaggi).
  const dosage = richtextToPlainText(content.dosage_and_application).trim()
  const usage = richtextToPlainText(content.usage).trim()
  if (dosage || usage) {
    const body = [dosage, usage].filter(Boolean).join('\n\n')
    sections.push({ kind: 'dosage', label: labels.dosage, body })
  }

  // Composizione.
  addPlainSection('composition', content.composition)

  // PZ/cartone.
  addPlainSection('units', content.units_per_carton)

  // Target bersaglio (da plugin/insetti).
  const targetPests = content.resolved_target_pests ?? mapTargetPests(content.target_pests)
  if (Array.isArray(targetPests) && targetPests.length > 0) {
    sections.push({ kind: 'targetPests', label: labels.targetPests, body: targetPests })
  }

  // Specifiche: nel template è per prodotti non chimici (dimensioni, peso...).
  addPlainSection('specifications', content.dimensions)

  // Riepilogo breve (paragrafo iniziale) — da short_description se presente.
  const summary = content.short_description?.trim() || undefined

  // Prima immagine prodotto.
  // Gli asset Storyblok sono oggetti con `mobile`/`desktop` (o asset diretto):
  // `getAssetSrc` gestisce entrambi e restituisce il filename valido.
  const firstImage =
    Array.isArray(content.images) && content.images.length > 0
      ? (content.images[0] as AssetStoryblok)
      : null
  const imageSrc = firstImage ? getAssetSrc(firstImage, true) : null

  return {
    uuid: story.uuid,
    sourceUpdatedAt: story.updated_at,
    categorySlug: opts.categorySlug,
    title: content.title || story.name,
    subtitle: content.secondary_title?.trim() || undefined,
    image: imageSrc,
    summary,
    sections,
    registration: content.registration?.trim() || undefined,
    footerCompany: opts.footerCompany || 'Newpharm S.r.l. - Via Tremarende 22, 35010 Santa Giustina in Colle (PD) - Italy',
    footerUpdated: opts.footerUpdated || '',
    locale: opts.locale || 'it',
  }
}
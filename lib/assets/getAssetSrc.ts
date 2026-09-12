/**
 * Estrae l'URL del filename da un asset Storyblok flessibile.
 *
 * Funzione pura (nessuna dipendenza React/next-intl): può essere usata
 * sia da componenti client sia da codice server-only (es. generazione PDF).
 *
 * Gestisce:
 * - Asset diretto: `{ filename: "..." }`
 * - Array di assets: `[{ filename: "..." }, ...]` – usa il primo elemento
 * - Asset con breakpoints: `{ mobile: {...}, desktop: {...} }` – con priorità configurabile
 */

export interface StoryblokAsset {
  id?: number
  alt?: string
  name?: string
  focus?: string
  title?: string
  filename: string
  copyright?: string
  fieldtype?: string
}

export interface StoryblokAssetWithBreakpoints {
  mobile?: StoryblokAsset | null
  desktop?: StoryblokAsset | null
}

export type FlexibleStoryblokAsset =
  | StoryblokAsset
  | StoryblokAsset[]
  | StoryblokAssetWithBreakpoints
  | null
  | undefined

/**
 * @param asset  L'asset Storyblok (qualsiasi formato accettato dal componente Asset)
 * @param preferDesktop  Se `true` (default), preferisce la variante desktop; altrimenti mobile
 * @returns L'URL del filename o `null` se non trovato
 */
export function getAssetSrc(
  asset: FlexibleStoryblokAsset,
  preferDesktop = true,
): string | null {
  if (!asset) return null

  // Se è un array, usa il primo elemento
  const normalized: StoryblokAsset | StoryblokAssetWithBreakpoints | null =
    Array.isArray(asset) ? (asset.length > 0 ? asset[0] : null) : asset

  if (!normalized) return null

  // Verifica se ha breakpoints mobile/desktop
  const hasBreakpoints =
    'mobile' in normalized || 'desktop' in normalized

  if (hasBreakpoints) {
    const bp = normalized as StoryblokAssetWithBreakpoints
    const primary = preferDesktop ? bp.desktop : bp.mobile
    const fallback = preferDesktop ? bp.mobile : bp.desktop

    return primary?.filename || fallback?.filename || null
  }

  // Asset diretto
  return (normalized as StoryblokAsset).filename || null
}
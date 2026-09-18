/**
 * Storyblok Link Utilities
 *
 * Utility functions for handling Storyblok link fields (multilink).
 */

import localeConfig from "@/i18n/locales.json";
import { parseLinkAction } from "@/lib/link-action";

export interface StoryblokLink {
  id?: string;
  url?: string;
  linktype?: string;
  fieldtype?: string;
  cached_url?: string;
  story?: {
    url?: string;
    [key: string]: any;
  };
}

/**
 * Verifica se una stringa è vuota o contiene solo spazi
 */
export function isEmpty(str?: string | null): boolean {
  return !str || str.trim() === "";
}

/**
 * Aggiunge https:// a un URL se non ha già un protocollo
 */
function ensureProtocol(url: string): string {
  // Se già ha http:// o https://, restituisce così com'è
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  // Altrimenti aggiunge https://
  return `https://${url}`;
}

/**
 * Verifica se un link è vuoto o non configurato
 */
export function isLinkEmpty(link?: StoryblokLink | null): boolean {
  if (!link) {
    return true;
  }

  // Se tutte le proprietà rilevanti sono vuote, il link è vuoto
  // (anche se linktype potrebbe essere impostato)
  const hasNoValidUrl =
    isEmpty(link.url) &&
    isEmpty(link.cached_url) &&
    isEmpty(link.story?.url) &&
    (!link.story || isEmpty(link.story.url));

  // Se linktype è vuoto o non valido E non c'è URL valido, il link è vuoto
  if (
    isEmpty(link.linktype) ||
    (link.linktype !== "story" && link.linktype !== "url")
  ) {
    return hasNoValidUrl;
  }

  // Anche se linktype è impostato, se non c'è nessun URL valido, il link è vuoto
  return hasNoValidUrl;
}

/**
 * Ottiene l'URL da un link Storyblok
 * - Se è una story, restituisce story.url
 * - Se è un link esterno (url), restituisce l'URL aggiungendo https:// se non presente
 * - Restituisce null se non c'è link o se i valori sono vuoti
 *
 * @param link - Il link Storyblok (multilink field)
 * @returns L'URL del link o null se non valido
 */
export function getLinkUrl(
  link?: (StoryblokLink & { anchor?: string }) | null
): string | null {
  // Se il link è vuoto o non configurato, restituisce null
  if (isLinkEmpty(link)) {
    return null;
  }

  // Se è una story, usa story.url
  if (link!.linktype === "story") {
    if (link!.anchor) {
      return "#" + link!.anchor;
    }
    if (link!.story?.url && !isEmpty(link!.story.url)) {
      return link!.story.url;
    }
    // Se story.url non è disponibile, controlla cached_url
    if (link!.cached_url && !isEmpty(link!.cached_url)) {
      return link!.cached_url;
    }
    // Se anche cached_url è vuoto, restituisce null
    return null;
  }

  // Se è un link esterno (url o external)
  if (link!.linktype === "url" || link!.linktype === "external") {
    const url = link!.url || link!.cached_url;

    // Se non c'è URL o è vuoto, restituisce null
    if (isEmpty(url)) {
      return null;
    }

    // Assicura che l'URL abbia il protocollo https://
    // url non può essere undefined qui perché isEmpty() lo ha già verificato
    return ensureProtocol(url!);
  }

  // Fallback: prova a usare cached_url o url se disponibili
  const fallbackUrl = link!.cached_url || link!.url;

  if (fallbackUrl && !isEmpty(fallbackUrl)) {
    // Se è un percorso relativo (inizia con /), restituisce così com'è
    if (fallbackUrl.startsWith("/")) {
      return fallbackUrl;
    }
    // Se sembra un URL esterno ma non ha protocollo, aggiunge https://
    // fallbackUrl non può essere undefined qui perché controllato sopra
    return ensureProtocol(fallbackUrl);
  }

  // Nessun URL valido trovato
  return null;
}

/**
 * Normalizza un URL Storyblok interno per router/link next-intl (senza prefisso locale).
 */
export function resolveInternalPathForNavigation(url: string): string {
  if (url.startsWith("#")) {
    return url;
  }

  if (url.match(/^https?:\/\//i) || url.match(/^www\./i)) {
    return url.match(/^www\./i) ? ensureProtocol(url) : url;
  }

  const locales = localeConfig.locales as readonly string[];
  let path = url.trim();

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const match = path.match(/^\/([a-z]{2})(\/|$)/);
  if (match && locales.includes(match[1])) {
    path = path.replace(new RegExp(`^/${match[1]}`), "") || "/";
  }

  if (path !== "/" && !path.startsWith("/")) {
    path = `/${path}`;
  }

  return path;
}

/**
 * Costruisce href interno con query string per navigazione client-side.
 */
export function buildStoryblokNavigationHref(
  url: string,
  searchParams?: URLSearchParams,
): string {
  const normalized = resolveInternalPathForNavigation(url);
  const query = searchParams?.toString();

  if (normalized.match(/^https?:\/\//i)) {
    if (!query) return normalized;
    const separator = normalized.includes("?") ? "&" : "?";
    return `${normalized}${separator}${query}`;
  }

  return query ? `${normalized}?${query}` : normalized;
}

type LinkStoryblokLike = {
  label?: string | null
  link?: StoryblokLink | null
  action?: unknown
}

/**
 * Normalizza righe CMS (footer, nav, link nested) in forma LinkStoryblok.
 */
export function coerceToLinkStoryblok(
  value: unknown,
): (LinkStoryblokLike & { _uid: string; component?: string }) | null {
  if (!value || typeof value !== "object") return null;

  if (isLinkStoryblokBlok(value)) {
    return value as LinkStoryblokLike & { _uid: string; component?: string };
  }

  const row = value as Record<string, unknown>;
  if (!("link" in row) && !("action" in row) && row.component !== "link") {
    return null;
  }

  const uid =
    typeof row._uid === "string" && row._uid.length > 0
      ? row._uid
      : "inline-link";

  return {
    _uid: uid,
    component: "link",
    label: typeof row.label === "string" ? row.label : null,
    link: (row.link as StoryblokLink | null | undefined) ?? null,
    action: row.action,
  };
}

export function hasDedicatedLinkAction(
  linkStoryblok?: LinkStoryblokLike | null,
): boolean {
  if (!linkStoryblok) return false;
  const action = parseLinkAction(linkStoryblok.action);
  if (action.type === "copy") return true;
  return action.type === "popup" && Boolean(action.popup);
}

export function findActionableLinkStoryblok(
  link?: SmartLinkLikeInput | SmartLinkLikeInput[] | null,
): (LinkStoryblokLike & { _uid: string }) | null {
  if (!link) return null;

  const candidates = Array.isArray(link) ? link : [link];
  for (const candidate of candidates) {
    const blok = coerceToLinkStoryblok(candidate);
    if (!blok || !hasDedicatedLinkAction(blok)) continue;
    if (!isLinkStoryblokValid(blok)) continue;
    return blok;
  }

  return null;
}

function isStoryblokMultilink(value: unknown): value is StoryblokLink {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.linktype === "string" ||
    row.fieldtype === "multilink" ||
    typeof row.cached_url === "string"
  );
}

/** URL di navigazione da multilink o riga CMS (ignora copy/popup configurati). */
export function getLinkUrlFromStoryblokInput(value: unknown): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = getLinkUrlFromStoryblokInput(item);
      if (url) return url;
    }
    return null;
  }

  if (isStoryblokMultilink(value)) {
    return getLinkUrl(value);
  }

  const linkBlok = coerceToLinkStoryblok(value);
  if (linkBlok) {
    if (hasDedicatedLinkAction(linkBlok)) return null;
    return getLinkUrl(linkBlok.link);
  }

  if (typeof value !== "object") return null;

  return getLinkUrl(value as StoryblokLink & { anchor?: string });
}

type SmartLinkLikeInput =
  | StoryblokLink
  | (StoryblokLink & { anchor?: string })
  | LinkStoryblokLike
  | (LinkStoryblokLike & { _uid: string })
  | null
  | undefined;

/**
 * Verifica se un oggetto è un blok Link (ha label, link e _uid)
 */
export function isLinkStoryblokBlok(
  value: unknown,
): value is LinkStoryblokLike & { _uid: string } {
  if (!value || typeof value !== "object" || !("_uid" in value)) {
    return false;
  }

  const blok = value as { component?: string; label?: unknown };
  if (blok.component === "link") return true;
  return "label" in value && "link" in value;
}

/**
 * Verifica se un LinkStoryblok è valido
 * - link: label + URL
 * - copy: solo label
 * - popup: label + popup selezionato
 */
export function isLinkStoryblokValid(
  linkStoryblok?: LinkStoryblokLike | null
): boolean {
  if (!linkStoryblok) {
    return false;
  }

  if (isEmpty(linkStoryblok.label)) {
    return false;
  }

  const action = parseLinkAction(linkStoryblok.action);
  if (action.type === "copy") return true;
  if (action.type === "popup") {
    if (action.popup) return true;
    return !isLinkEmpty(linkStoryblok.link);
  }
  return !isLinkEmpty(linkStoryblok.link);
}

/**
 * Ottiene il primo LinkStoryblok valido da un array
 */
export function getFirstValidLink<T extends LinkStoryblokLike>(
  links?: T[] | null
): T | null {
  if (!links || links.length === 0) {
    return null;
  }

  for (const item of links) {
    if (isLinkStoryblokValid(item)) {
      return item;
    }
  }

  return null;
}

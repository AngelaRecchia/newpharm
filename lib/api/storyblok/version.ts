/**
 * Modalità Storyblok (draft / published).
 *
 * File senza import del client CDN: i componenti client possono
 * leggerlo senza tirare `STORYBLOK_ACCESS_TOKEN` nel bundle.
 *
 * Controllata da NEXT_PUBLIC_STORYBLOK_VERSION:
 * - 'draft'     → contenuti draft + bridge (locale / preview)
 * - 'published' → contenuti pubblicati, bridge disattivato
 *
 * Default: 'draft'
 */

function getStoryblokMode(): "draft" | "published" {
  const mode = process.env.NEXT_PUBLIC_STORYBLOK_VERSION;
  return mode === "published" ? "published" : "draft";
}

export function isProduction(): boolean {
  return getStoryblokMode() === "published";
}

export function getStoryblokVersion(): "draft" | "published" {
  return getStoryblokMode();
}

/** Pre-genera tutte le route in build (SSG/ISR). In draft: on-demand per ridurre quota API. */
export function shouldPrebuildStoryPaths(): boolean {
  return getStoryblokMode() === "published";
}

export function shouldEnableBridge(): boolean {
  return getStoryblokMode() === "draft";
}

/** Visual Editor Storyblok: iframe o query `_storyblok`. */
export function isInsideStoryblokEditor(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.location !== window.parent.location ||
      window.location.search.includes("_storyblok") ||
      window.location.search.includes("_storyblok_tk")
    );
  } catch {
    return true;
  }
}

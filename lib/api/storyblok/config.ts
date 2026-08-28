/**
 * Storyblok Configuration & Environment
 *
 * Handles environment detection, version management, and cache version.
 */

import { getStoryblokApi } from "./client";

// ============================================
// Environment Detection
// ============================================

/**
 * Modalità Storyblok controllata da NEXT_PUBLIC_STORYBLOK_MODE.
 *
 * Valori:
 * - 'draft'     → contenuti draft + bridge attivo (live preview)
 * - 'published' → contenuti pubblicati, bridge disattivato
 *
 * Default: 'draft' (sviluppo locale e preview)
 *
 * Imposta in .env.local o nelle env vars di Vercel:
 *   NEXT_PUBLIC_STORYBLOK_VERSION=draft      # per live preview
 *   NEXT_PUBLIC_STORYBLOK_VERSION=published   # per produzione
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

// ============================================
// Cache Version Management
// ============================================

let cachedCv: number | null = null;
let cvFetchTime: number = 0;
const CV_CACHE_TTL_PUBLISHED = 60000;
const CV_CACHE_TTL_DRAFT = 5000;

function cacheTtlMs(): number {
  return isProduction() ? CV_CACHE_TTL_PUBLISHED : CV_CACHE_TTL_DRAFT;
}

function parseCacheVersion(data: unknown): number | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const space =
    record.space && typeof record.space === "object"
      ? (record.space as Record<string, unknown>)
      : undefined;
  const raw =
    space?.version ??
    space?.cache_version ??
    space?.cv ??
    record.cache_version ??
    record.cv;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Cache version for Storyblok CDN requests (`cv`).
 * Draft: TTL breve così listing/picker vedono le stories appena create.
 * Published: TTL 1 minuto.
 */
export async function getCacheVersion(): Promise<number | undefined> {
  const now = Date.now();

  if (cachedCv !== null && now - cvFetchTime < cacheTtlMs()) {
    return cachedCv;
  }

  try {
    const storyblokApi = getStoryblokApi();
    const { data } = await storyblokApi.get("cdn/spaces/me");
    const cv = parseCacheVersion(data);

    if (cv !== undefined) {
      cachedCv = cv;
      cvFetchTime = now;
      return cv;
    }
  } catch {
    if (cachedCv !== null) {
      return cachedCv;
    }
  }

  return undefined;
}

/**
 * Clear the cached cv (useful for testing or manual invalidation)
 */
export function clearCacheVersion(): void {
  cachedCv = null;
  cvFetchTime = 0;
}

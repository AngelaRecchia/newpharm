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

// ============================================
// Cache Version Management
// ============================================

let cachedCv: number | null = null;
let cvFetchTime: number = 0;
const CV_CACHE_TTL = 60000; // 1 minute cache for cv in production

/**
 * Get cache version for Storyblok CDN requests
 *
 * Development/Preview: Returns undefined to omit cv parameter, encouraging CDN caching
 * Production: Fetches current cv from /spaces/me and caches it for 1 minute
 *
 * @returns Cache version number or undefined to omit cv parameter
 */
export async function getCacheVersion(): Promise<number | undefined> {
  // In draft mode: omit cv parameter to encourage caching
  if (!isProduction()) {
    // Return undefined to omit cv parameter, allowing Storyblok CDN to cache
    return undefined;
  }

  // In production: fetch current cv from /spaces/me
  const now = Date.now();

  // Return cached cv if still valid
  if (cachedCv !== null && now - cvFetchTime < CV_CACHE_TTL) {
    return cachedCv;
  }

  try {
    const storyblokApi = getStoryblokApi();
    const { data } = await storyblokApi.get("spaces/me");

    // Extract cv from space data
    // Storyblok returns cv in different possible locations
    const cv =
      data?.space?.cache_version ||
      data?.space?.cv ||
      data?.cache_version ||
      data?.cv;

    if (cv) {
      cachedCv = cv;
      cvFetchTime = now;
      return cv;
    }
  } catch (error) {
    // If fetch fails, return cached value if available, otherwise undefined
    if (cachedCv !== null) {
      return cachedCv;
    }
  }

  // Return undefined if we can't get cv (Storyblok will handle it)
  return undefined;
}

/**
 * Clear the cached cv (useful for testing or manual invalidation)
 */
export function clearCacheVersion(): void {
  cachedCv = null;
  cvFetchTime = 0;
}

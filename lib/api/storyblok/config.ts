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
 * Determina se siamo in produzione o in draft mode
 *
 * Priorità:
 * 1. VERCEL_ENV (impostata automaticamente da Vercel)
 * 2. NODE_ENV (impostata automaticamente da Next.js/Vercel)
 *
 * NOTA: Non è necessario impostare manualmente queste variabili:
 * - Vercel imposta automaticamente VERCEL_ENV e NODE_ENV
 * - Next.js imposta automaticamente NODE_ENV durante build/dev
 * - Per sviluppo locale: npm run dev → NODE_ENV=development (automatico)
 * - Per build: npm run build → NODE_ENV=production (automatico)
 */
export function isProduction(): boolean {
  // VERCEL_ENV è impostata automaticamente da Vercel
  // Valori possibili: 'production', 'preview', 'development'
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "production") {
    return true;
  }

  // Fallback: NODE_ENV è impostata automaticamente da Next.js/Vercel
  // Non serve impostarla manualmente
  return process.env.NODE_ENV === "production";
}

/**
 * Determina la versione di Storyblok da usare
 * 'draft' per sviluppo/preview, 'published' per produzione
 */
export function getStoryblokVersion(): "draft" | "published" {
  return isProduction() ? "published" : "draft";
}

/**
 * Determina se il bridge di Storyblok deve essere abilitato
 * Il bridge funziona solo in draft mode (non in produzione)
 */
export function shouldEnableBridge(): boolean {
  return !isProduction();
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
 * Development: Returns undefined to omit cv parameter, encouraging CDN caching
 * Production: Fetches current cv from /spaces/me and caches it for 1 minute
 *
 * @returns Cache version number or undefined to omit cv parameter
 */
export async function getCacheVersion(): Promise<number | undefined> {
  // NODE_ENV è impostata automaticamente:
  // - 'development' durante npm run dev (Next.js)
  // - 'production' durante npm run build (Next.js/Vercel)
  // Non serve impostarla manualmente
  const isDev = process.env.NODE_ENV === "development";

  // In development: omit cv parameter to encourage caching
  if (isDev) {
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

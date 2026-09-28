/**
 * Storyblok Configuration & Environment
 *
 * Version/mode helpers: `./version` (safe per i client components).
 * Cache version: richiede il client CDN (solo server).
 */

import { getStoryblokApi } from "./client";
import { isProduction } from "./version";

export {
  getStoryblokVersion,
  isInsideStoryblokEditor,
  isProduction,
  shouldEnableBridge,
  shouldPrebuildStoryPaths,
} from "./version";

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

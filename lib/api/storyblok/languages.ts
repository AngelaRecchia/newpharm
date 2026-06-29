/**
 * Storyblok Languages API
 *
 * Functions for fetching available locales/languages from Storyblok.
 * In development the result is cached on the filesystem (.cache/storyblok/_langs.json)
 * to avoid burning Management API quota on every reload.
 */

import { getStoryblokApi } from "./client";
import { getStoryblokVersion, getCacheVersion } from "./config";
import StoryblokClient from "storyblok-js-client";

const isDev = process.env.NODE_ENV === "development";

/**
 * Interface for Storyblok folder/story from Management API
 */
interface StoryblokStory {
  id: number;
  name: string;
  slug: string;
  full_slug: string;
  is_folder: boolean;
  /** Cartella annidata: punta alla story padre; radice = null / assente */
  parent_id: number | null;
  published: boolean;
  [key: string]: any;
}

/** Solo cartelle di primo livello (locale root), non sotto-cartelle tipo `it/section` */
function isRootLocaleFolder(story: StoryblokStory): boolean {
  const full = (story.full_slug ?? story.slug ?? "").trim();
  if (!full || full.includes("/")) return false;
  const p = story.parent_id;
  if (p != null && p !== 0) return false;
  return true;
}

interface StoryblokStoriesResponse {
  stories: StoryblokStory[];
  [key: string]: any;
}

/**
 * Get Management API client
 */
function getManagementApi() {
  const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || "";

  if (!MANAGEMENT_TOKEN) {
    throw new Error(
      "STORYBLOK_MANAGEMENT_TOKEN not found. Get it from: https://app.storyblok.com/#/me/account"
    );
  }

  return new StoryblokClient({
    oauthToken: MANAGEMENT_TOKEN,
  });
}

/**
 * Get Space ID from environment
 */
function getSpaceId(): string {
  const spaceId = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID;

  if (!spaceId) {
    throw new Error("NEXT_PUBLIC_STORYBLOK_SPACE_ID not found in environment");
  }

  return spaceId;
}

/**
 * Read/write a JSON cache file in .cache/storyblok/
 * Only active when NODE_ENV === 'development'
 */
function readFsCache<T>(fileName: string): T | null {
  if (!isDev) return null;
  try {
    // eslint-disable-next-line
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line
    const path = require("path") as typeof import("path");
    const filePath = path.join(process.cwd(), ".cache", "storyblok", fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {
    /* cache miss */
  }
  return null;
}

function writeFsCache(fileName: string, data: unknown): void {
  if (!isDev) return;
  try {
    // eslint-disable-next-line
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line
    const path = require("path") as typeof import("path");
    const dir = path.join(process.cwd(), ".cache", "storyblok");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data));
  } catch {
    /* ignore write errors */
  }
}

/**
 * Retrieves available locales from Storyblok using Management API.
 *
 * How it works:
 * 1. Queries Management API per tutte le cartelle (`folder_only`), senza `level` (non supportato qui)
 * 2. Tiene solo cartelle di **primo livello**: `full_slug` senza `/` e senza `parent_id` (o parent 0)
 * 3. Filtra published / excludePaths
 * 4. Opzionalmente verifica che ogni cartella abbia almeno una story pubblicata (CDN)
 * 5. Restituisce i codici locale
 *
 * In development the result is cached to .cache/storyblok/_langs.json.
 * Delete the file (or the whole .cache folder) to force a refresh.
 *
 * @param options - Optional configuration
 * @param options.excludePaths - Folder names to exclude (default: ['layout-components'])
 * @param options.checkForContent - Verify each locale has published content (default: true)
 * @returns Array of available locale codes (e.g., ['en', 'it', 'ar'])
 *
 * @example
 * // Quick check - just get folders
 * const locales = await getLangs({ checkForContent: false })
 *
 * @example
 * // Deep check - verify content exists (default)
 * const locales = await getLangs()
 */
export async function getLangs(
  options: {
    excludePaths?: string[];
    checkForContent?: boolean;
    /** Bypass .cache/storyblok/_langs.json (es. script fetch-locales pre-build) */
    skipCache?: boolean;
  } = {}
): Promise<string[]> {
  const {
    excludePaths = ["layout-components"],
    checkForContent = true,
    skipCache = false,
  } = options;

  // Check filesystem cache first (dev only)
  if (!skipCache) {
    const cached = readFsCache<string[]>("_langs.json");
    if (cached) return cached;
  }

  try {
    const managementApi = getManagementApi();
    const spaceId = getSpaceId();
    const requirePublished = getStoryblokVersion() === "published";

    /** Tutte le pagine: `folder_only` senza `level` (non supportato) restituisce anche cartelle annidate */
    const allFolderStories: StoryblokStory[] = [];
    const perPage = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await managementApi.get(`spaces/${spaceId}/stories`, {
        folder_only: true,
        per_page: perPage,
        page,
      });

      const data = response.data as StoryblokStoriesResponse;
      const batch = data?.stories ?? [];
      allFolderStories.push(...batch);
      hasMore = batch.length === perPage;
      page += 1;
    }

    if (allFolderStories.length === 0) {
      console.warn("No folders found in Storyblok");
      return [];
    }

    // Filter folder candidates: solo root locale (no nested `it/foo`)
    const folderCandidates = allFolderStories
      .filter((story) => {
        if (!isRootLocaleFolder(story)) return false;

        // Skip unpublished folders in production
        if (requirePublished && !story.published) {
          return false;
        }

        const folderName = story.slug || story.name;

        // Skip excluded paths
        if (excludePaths.includes(folderName)) {
          return false;
        }

        return true;
      })
      .map((story) => ({
        id: story.id,
        slug: story.slug || story.name,
      }));

    // If no content check needed, return immediately
    if (!checkForContent) {
      const locales = folderCandidates.map((f) => f.slug).sort();

      if (locales.length === 0) {
        console.warn("No valid locale folders found");
      }

      // Cache before returning
      if (locales.length > 0) writeFsCache("_langs.json", locales);

      return locales;
    }

    // Deep check: verify each folder has published content using CDN API
    const localesSet = new Set<string>();
    const storyblokApi = getStoryblokApi();
    const version = getStoryblokVersion();
    const cv = await getCacheVersion();

    for (const folder of folderCandidates) {
      try {
        const params: Record<string, any> = {
          starts_with: `${folder.slug}/`,
          version,
          per_page: 1, // We only need to know if at least 1 exists
          excluding_fields: "body", // Exclude content to speed up
        };

        // Add cv parameter if available (omitted in dev to encourage caching)
        if (cv !== undefined) {
          params.cv = cv;
        }

        // Query stories inside this folder using CDN API with starts_with
        const { data } = await storyblokApi.get("cdn/stories", params);

        // If there's at least one story, add locale
        if (data?.stories && data.stories.length > 0) {
          localesSet.add(folder.slug);
        }
      } catch (error) {
        console.warn(
          `Could not check content for folder ${folder.slug}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    const locales = Array.from(localesSet).sort();

    // Cache before returning
    if (locales.length > 0) writeFsCache("_langs.json", locales);

    return locales;
  } catch (error) {
    // Return empty array on error to avoid breaking the app
    return [];
  }
}

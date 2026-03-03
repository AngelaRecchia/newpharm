/**
 * Storyblok Languages API
 *
 * Functions for fetching available locales/languages from Storyblok.
 * In development the result is cached on the filesystem (.cache/storyblok/_langs.json)
 * to avoid burning Management API quota on every reload.
 */

import { getStoryblokApi } from './client'
import { getStoryblokVersion, getCacheVersion } from './config'
import StoryblokClient from "storyblok-js-client"

const isDev = process.env.NODE_ENV === 'development'

/**
 * Interface for Storyblok folder/story from Management API
 */
interface StoryblokStory {
  id: number
  name: string
  slug: string
  full_slug: string
  is_folder: boolean
  parent_id: number | null
  published: boolean
  [key: string]: any
}

interface StoryblokStoriesResponse {
  stories: StoryblokStory[]
  [key: string]: any
}

/**
 * Get Management API client
 */
function getManagementApi() {
  const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ""

  if (!MANAGEMENT_TOKEN) {
    throw new Error(
      "STORYBLOK_MANAGEMENT_TOKEN not found. Get it from: https://app.storyblok.com/#/me/account"
    )
  }

  return new StoryblokClient({
    oauthToken: MANAGEMENT_TOKEN,
  })
}

/**
 * Get Space ID from environment
 */
function getSpaceId(): string {
  const spaceId = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID

  if (!spaceId) {
    throw new Error("NEXT_PUBLIC_STORYBLOK_SPACE_ID not found in environment")
  }

  return spaceId
}

/**
 * Read/write a JSON cache file in .cache/storyblok/
 * Only active when NODE_ENV === 'development'
 */
function readFsCache<T>(fileName: string): T | null {
  if (!isDev) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const filePath = path.join(process.cwd(), '.cache', 'storyblok', fileName)
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch { /* cache miss */ }
  return null
}

function writeFsCache(fileName: string, data: unknown): void {
  if (!isDev) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const dir = path.join(process.cwd(), '.cache', 'storyblok')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data))
  } catch { /* ignore write errors */ }
}

/**
 * Retrieves available locales from Storyblok using Management API.
 *
 * How it works:
 * 1. Queries Management API for root-level folders (parent_id = 0)
 * 2. Filters folders based on published status and exclude list
 * 3. Optionally verifies each folder has at least one published story
 * 4. Returns unique locale codes
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
    excludePaths?: string[]
    checkForContent?: boolean
  } = {}
): Promise<string[]> {
  // Check filesystem cache first (dev only)
  const cached = readFsCache<string[]>('_langs.json')
  if (cached) return cached

  const { excludePaths = ["layout-components"], checkForContent = true } =
    options

  try {
    const managementApi = getManagementApi()
    const spaceId = getSpaceId()
    const requirePublished = getStoryblokVersion() === "published"

    // Get all root-level folders
    const response = await managementApi.get(`spaces/${spaceId}/stories`, {
      folder_only: true,
      level: 0,
    })

    const data = response.data as StoryblokStoriesResponse
    if (!data?.stories || data.stories.length === 0) {
      console.warn("No root-level folders found in Storyblok")
      return []
    }

    // Filter folder candidates
    const folderCandidates = data.stories
      .filter((story) => {
        // Skip unpublished folders in production
        if (requirePublished && !story.published) {
          return false
        }

        const folderName = story.slug || story.name

        // Skip excluded paths
        if (excludePaths.includes(folderName)) {
          return false
        }

        return true
      })
      .map((story) => ({
        id: story.id,
        slug: story.slug || story.name,
      }))

    // If no content check needed, return immediately
    if (!checkForContent) {
      const locales = folderCandidates.map((f) => f.slug).sort()

      if (locales.length === 0) {
        console.warn("No valid locale folders found")
      }

      // Cache before returning
      if (locales.length > 0) writeFsCache('_langs.json', locales)

      return locales
    }

    // Deep check: verify each folder has published content using CDN API
    const localesSet = new Set<string>()
    const storyblokApi = getStoryblokApi()
    const version = getStoryblokVersion()
    const cv = await getCacheVersion()

    for (const folder of folderCandidates) {
      try {
        const params: Record<string, any> = {
          starts_with: `${folder.slug}/`,
          version,
          per_page: 1, // We only need to know if at least 1 exists
          excluding_fields: "body", // Exclude content to speed up
        }

        // Add cv parameter if available (omitted in dev to encourage caching)
        if (cv !== undefined) {
          params.cv = cv
        }

        // Query stories inside this folder using CDN API with starts_with
        const { data } = await storyblokApi.get("cdn/stories", params)

        // If there's at least one story, add locale
        if (data?.stories && data.stories.length > 0) {
          localesSet.add(folder.slug)
        }
      } catch (error) {
        console.warn(
          `Could not check content for folder ${folder.slug}:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    const locales = Array.from(localesSet).sort()

    // Cache before returning
    if (locales.length > 0) writeFsCache('_langs.json', locales)

    return locales
  } catch (error) {
    // Return empty array on error to avoid breaking the app
    return []
  }
}

/**
 * Storyblok CDN API Client
 *
 * Wraps .get() with:
 * - Filesystem cache (dev + build) to reduce API quota
 * - Throttling + retry on 429 (Storyblok CDN: 6 req/s)
 *
 * Cache lives in .cache/storyblok/ — delete it to force a refresh.
 * Set STORYBLOK_DISABLE_FS_CACHE=true to disable filesystem cache.
 */

const MIN_REQUEST_GAP_MS = 180 // ~5.5 req/s, sotto il limite CDN (6/s)
const MAX_429_RETRIES = 4

let requestChain: Promise<unknown> = Promise.resolve()

function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const run = requestChain.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS))
    return fn()
  })
  requestChain = run.catch(() => {})
  return run
}

async function getWithRetry<T>(
  originalGet: (endpoint: string, params?: Record<string, unknown>) => Promise<T>,
  endpoint: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    try {
      return await scheduleRequest(() => originalGet(endpoint, params))
    } catch (error: unknown) {
      lastError = error
      const status = (error as { status?: number })?.status
      if (status === 429 && attempt < MAX_429_RETRIES) {
        const backoffMs = 1000 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        continue
      }
      throw error
    }
  }

  throw lastError
}

function shouldUseFsCache(): boolean {
  return process.env.STORYBLOK_DISABLE_FS_CACHE !== 'true'
}

export function getStoryblokApi() {
  // eslint-disable-next-line
  const StoryblokClient = require('storyblok-js-client')
  const client = new StoryblokClient({
    accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || '',
    space: process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID,
  })

  const originalGet = client.get.bind(client)

  client.get = async (endpoint: string, params: Record<string, unknown> = {}) => {
    if (!shouldUseFsCache()) {
      return getWithRetry(originalGet, endpoint, params)
    }

    // eslint-disable-next-line
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line
    const path = require('path') as typeof import('path')
    // eslint-disable-next-line
    const crypto = require('crypto') as typeof import('crypto')

    const CACHE_DIR = path.join(process.cwd(), '.cache', 'storyblok')
    const sorted = Object.fromEntries(
      Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    )
    const key = crypto
      .createHash('md5')
      .update(endpoint + JSON.stringify(sorted))
      .digest('hex')
    const filePath = path.join(CACHE_DIR, `${key}.json`)

    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      }
    } catch {
      /* cache miss */
    }

    const result = await getWithRetry(originalGet, endpoint, params)

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(result))
    } catch {
      /* ignore write errors */
    }

    return result
  }

  return client
}

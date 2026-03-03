/**
 * Storyblok CDN API Client
 *
 * In development, wraps .get() with a filesystem cache to avoid
 * burning API quota while content hasn't changed.
 * Cache lives in .cache/storyblok/ — delete it to force a refresh.
 */

const isDev = process.env.NODE_ENV === 'development'

export function getStoryblokApi() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const StoryblokClient = require('storyblok-js-client')
  const client = new StoryblokClient({
    accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || '',
    space: process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID,
  })

  if (!isDev) return client

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto')

  const CACHE_DIR = path.join(process.cwd(), '.cache', 'storyblok')

  const originalGet = client.get.bind(client)

  client.get = async (endpoint: string, params: Record<string, any> = {}) => {
    const sorted = Object.fromEntries(
      Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    )
    const key = crypto.createHash('md5').update(endpoint + JSON.stringify(sorted)).digest('hex')
    const filePath = path.join(CACHE_DIR, `${key}.json`)

    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      }
    } catch {}

    const result = await originalGet(endpoint, params)

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(result))
    } catch {}

    return result
  }

  return client
}

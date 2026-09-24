import { routing } from '@/i18n/routing'

const locales = routing.locales as readonly string[]

/** Path interno senza prefisso locale, per confronto post-navigazione. */
export function internalPathFromHref(href: string): string {
  let path = href.trim()
  if (!path) return '/'

  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      return path
    }
  }

  if (!path.startsWith('/')) path = `/${path}`

  const match = path.match(/^\/([a-z]{2})(\/.*|$)/)
  if (match && locales.includes(match[1] as (typeof locales)[number])) {
    const rest = match[2]
    return rest && rest.length > 0 ? rest : '/'
  }

  return path
}

export function pathnameMatchesHref(pathname: string, href: string): boolean {
  const target = internalPathFromHref(href)
  const current = internalPathFromHref(pathname)
  if (current === target) return true
  return current.endsWith(target) || target.endsWith(current)
}

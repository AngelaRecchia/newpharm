'use client'

import { forwardRef } from 'react'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { ComponentProps } from 'react'
import { getLinkUrl, StoryblokLink, getFirstValidLink, isLinkStoryblokValid } from '@/lib/api/utils/links'
import { LinkStoryblok } from '@/types/storyblok'

type LinkProps = ComponentProps<typeof Link>

interface SmartLinkProps extends Omit<LinkProps, 'href'> {
    href?: string
    link?: (StoryblokLink & { anchor?: string }) | (StoryblokLink & { anchor?: string })[] | LinkStoryblok | LinkStoryblok[] | null
    children?: React.ReactNode
}

/**
 * SmartLink component that automatically handles locale prefixes in URLs.
 * 
 * Can accept either:
 * - `href`: A direct URL string
 * - `link`: A Storyblok link object (multilink field), LinkStoryblok, or arrays of either
 * 
 * If the href contains a locale prefix (e.g., '/it/page' or '/it'),
 * it extracts the locale and uses it with next-intl's Link component,
 * removing the locale from the href path.
 * 
 * If `link` is an array, it uses the first valid link from the array.
 * If `link` is a LinkStoryblok, it extracts the nested `link` field.
 * 
 * If neither `href` nor `link` is valid, it renders a `div` instead of a link.
 * 
 * Examples:
 * - href="/it/about" → <Link href="/about" locale="it" />
 * - href="/it" → <Link href="/" locale="it" />
 * - href="/about" → <Link href="/about" />
 * - href="about" → <Link href="about" /> (relative path, no locale processing)
 * - href="https://example.com" → <Link href="https://example.com" /> (external, no locale processing)
 * - link={storyblokLink} → Uses getLinkUrl() to extract URL from Storyblok link
 * - link={linkStoryblok} → Extracts link.link and uses getLinkUrl()
 * - link={[link1, link2]} → Uses the first valid link from the array
 * - No valid href/link → <div> (non-clickable)
 */
const SmartLink = forwardRef<HTMLAnchorElement | HTMLDivElement, SmartLinkProps>(({ href, link, ...props }, ref) => {
    const locales = routing.locales

    // Se c'è un link Storyblok, usa quello, altrimenti usa href
    // Gestisce sia array che singolo link, sia StoryblokLink che LinkStoryblok
    let linkUrl: string | undefined
    if (link) {
        if (Array.isArray(link)) {
            // Se è un array, verifica se è LinkStoryblok[] o StoryblokLink[]
            // Gestisce anche array misti
            for (const item of link) {
                if (!item) continue

                // Verifica se è un LinkStoryblok (ha label, link e _uid)
                if ('label' in item && 'link' in item && '_uid' in item) {
                    // È un LinkStoryblok
                    if (isLinkStoryblokValid(item as LinkStoryblok)) {
                        const url = getLinkUrl((item as LinkStoryblok).link)
                        if (url) {
                            linkUrl = url
                            break
                        }
                    }
                } else {
                    // È un StoryblokLink diretto
                    const url = getLinkUrl(item as StoryblokLink & { anchor?: string })
                    if (url) {
                        linkUrl = url
                        break
                    }
                }
            }
        } else {
            // Singolo link
            if ('label' in link && 'link' in link && '_uid' in link) {
                // È un LinkStoryblok
                if (isLinkStoryblokValid(link as LinkStoryblok)) {
                    const url = getLinkUrl((link as LinkStoryblok).link)
                    linkUrl = url || undefined
                }
            } else {
                // È un StoryblokLink diretto
                const url = getLinkUrl(link as StoryblokLink & { anchor?: string })
                linkUrl = url || undefined
            }
        }
    }

    // Se non c'è linkUrl da link, usa href
    if (!linkUrl) {
        linkUrl = href
    }

    // Se non c'è URL valido, renderizza un div
    // Rimuovi le props specifiche di link/anchor che non sono valide per un div
    if (!linkUrl) {
        const { target, replace, href, ...divProps } = props as any
        return <div ref={ref as React.Ref<HTMLDivElement>} {...(divProps as React.HTMLAttributes<HTMLDivElement>)} />
    }

    // Se è un anchor link (inizia con #), passa direttamente
    if (linkUrl.startsWith('#')) {
        return <Link ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} />
    }

    // Se è un URL esterno (http/https), passa direttamente
    if (linkUrl.match(/^https?:\/\//i)) {
        return <a ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} target="_blank" rel="noopener noreferrer" />
    }

    // Se l'URL inizia con www., trattalo come URL esterno
    if (linkUrl.match(/^www\./i)) {
        return <a ref={ref as React.Ref<HTMLAnchorElement>} href={`https://${linkUrl}`} {...props} target="_blank" rel="noopener noreferrer" />
    }

    // Check if URL starts with locale (with or without leading slash)
    // Examples: '/it/page', '/it', 'it/', 'it', 'it/test'
    const match = linkUrl.match(/^\/?([a-z]{2})(\/|$)/)

    if (match) {
        const detectedLocale = match[1]
        if (locales.includes(detectedLocale as any)) {
            // Remove locale from href (handle both '/it/page' and 'it/page' and 'it/test')
            let pathWithoutLocale = linkUrl
                .replace(/^\/?/, '') // Remove optional leading slash
                .replace(new RegExp(`^${detectedLocale}(/|$)`), '') || '/'

            // Assicura che il percorso inizi con / se non è vuoto
            // Questo previene percorsi relativi che causano navigazioni errate
            if (pathWithoutLocale && pathWithoutLocale !== '/' && !pathWithoutLocale.startsWith('/')) {
                pathWithoutLocale = '/' + pathWithoutLocale
            }

            return <Link ref={ref as React.Ref<HTMLAnchorElement>} href={pathWithoutLocale} locale={detectedLocale} {...props} />
        }
    }

    // If URL starts with / but no locale detected, process normally
    if (linkUrl.startsWith('/')) {
        // Regular internal link without locale prefix
        return <Link ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} />
    }

    // Se l'URL non inizia con / e non ha locale, potrebbe essere un percorso relativo
    // Normalizzalo aggiungendo / all'inizio per renderlo assoluto
    const normalizedUrl = linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl
    return <Link ref={ref as React.Ref<HTMLAnchorElement>} href={normalizedUrl} {...props} />
})

SmartLink.displayName = 'SmartLink'

export default SmartLink

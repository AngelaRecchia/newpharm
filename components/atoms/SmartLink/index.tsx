'use client'

import { forwardRef } from 'react'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { ComponentProps } from 'react'
import { getLinkUrl, StoryblokLink } from '@/lib/api/utils/links'

type LinkProps = ComponentProps<typeof Link>

interface SmartLinkProps extends Omit<LinkProps, 'href'> {
    href?: string
    link?: (StoryblokLink & { anchor?: string }) | (StoryblokLink & { anchor?: string })[] | null
    children?: React.ReactNode
}

/**
 * SmartLink component that automatically handles locale prefixes in URLs.
 * 
 * Can accept either:
 * - `href`: A direct URL string
 * - `link`: A Storyblok link object (multilink field) or an array of link objects
 * 
 * If the href contains a locale prefix (e.g., '/it/page' or '/it'),
 * it extracts the locale and uses it with next-intl's Link component,
 * removing the locale from the href path.
 * 
 * If `link` is an array, it uses the first valid link from the array.
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
 * - link={[link1, link2]} → Uses the first valid link from the array
 * - No valid href/link → <div> (non-clickable)
 */
const SmartLink = forwardRef<HTMLAnchorElement | HTMLDivElement, SmartLinkProps>(({ href, link, ...props }, ref) => {
    const locales = routing.locales

    // Se c'è un link Storyblok, usa quello, altrimenti usa href
    // Gestisce sia array che singolo link
    let linkUrl: string | undefined
    if (link) {
        if (Array.isArray(link)) {
            // Se è un array, prendi il primo link valido
            const firstLink = link.find(l => l && getLinkUrl(l))
            const url = firstLink ? getLinkUrl(firstLink) : null
            linkUrl = url || undefined
        } else {
            const url = getLinkUrl(link)
            linkUrl = url || undefined
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

'use client'

import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { ComponentProps } from 'react'
import { getLinkUrl, StoryblokLink } from '@/lib/api/utils/links'

type LinkProps = ComponentProps<typeof Link>

interface SmartLinkProps extends Omit<LinkProps, 'href'> {
    href?: string
    link?: StoryblokLink & { anchor?: string } | null
    children?: React.ReactNode
}

/**
 * SmartLink component that automatically handles locale prefixes in URLs.
 * 
 * Can accept either:
 * - `href`: A direct URL string
 * - `link`: A Storyblok link object (multilink field)
 * 
 * If the href contains a locale prefix (e.g., '/it/page' or '/it'),
 * it extracts the locale and uses it with next-intl's Link component,
 * removing the locale from the href path.
 * 
 * Examples:
 * - href="/it/about" → <Link href="/about" locale="it" />
 * - href="/it" → <Link href="/" locale="it" />
 * - href="/about" → <Link href="/about" />
 * - href="about" → <Link href="about" /> (relative path, no locale processing)
 * - href="https://example.com" → <Link href="https://example.com" /> (external, no locale processing)
 * - link={storyblokLink} → Uses getLinkUrl() to extract URL from Storyblok link
 */
export default function SmartLink({ href, link, ...props }: SmartLinkProps) {
    const locales = routing.locales

    // Se c'è un link Storyblok, usa quello, altrimenti usa href
    let linkUrl = link ? getLinkUrl(link) : href

    // Se non c'è URL valido, non renderizzare nulla
    if (!linkUrl) {
        linkUrl = '/'
    }

    // Check if URL starts with locale (with or without leading slash)
    // Examples: '/it/page', '/it', 'it/', 'it'
    const match = linkUrl.match(/^\/?([a-z]{2})(\/|$)/)

    if (match) {
        const detectedLocale = match[1]
        if (locales.includes(detectedLocale as any)) {
            // Remove locale from href (handle both '/it/page' and 'it/page')
            const pathWithoutLocale = linkUrl
                .replace(/^\/?/, '') // Remove optional leading slash
                .replace(new RegExp(`^${detectedLocale}(/|$)`), '') || '/'

            return <Link href={pathWithoutLocale} locale={detectedLocale} {...props} />
        }
    }

    // If URL starts with / but no locale detected, process normally
    if (linkUrl.startsWith('/')) {
        // Regular internal link without locale prefix
        return <Link href={linkUrl} {...props} />
    }

    // No locale detected or URL doesn't start with /, regular link
    // next-intl Link will handle it normally
    return <Link href={linkUrl} {...props} />
}

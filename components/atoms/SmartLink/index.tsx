'use client'

import { forwardRef, useCallback, useMemo } from 'react'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { ComponentProps } from 'react'
import {
  findActionableLinkStoryblok,
  getLinkUrlFromStoryblokInput,
} from '@/lib/api/utils/links'
import { useGlossary } from '@/lib/glossary/context'
import { openPopup, parseLinkAction } from '@/lib/link-action'
import { useCopyPageLink } from '@/lib/use-copy-page-link'
import { useProductViewTransition } from '@/lib/context/product-view-transition-context'
type LinkProps = ComponentProps<typeof Link>

interface SmartLinkProps extends Omit<LinkProps, 'href'> {
    href?: string
    link?: unknown
    children?: React.ReactNode
    /** Abilita morph immagine prodotto verso il dettaglio (uuid story). */
    productTransitionId?: string
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
const SmartLink = forwardRef<HTMLAnchorElement | HTMLDivElement | HTMLButtonElement, SmartLinkProps>(({ href, link, children, productTransitionId, onClick, ...props }, ref) => {
    const locales = routing.locales
    const glossary = useGlossary()
    const { copyPageLink } = useCopyPageLink()
    const productViewTransition = useProductViewTransition()

    const actionLink = useMemo(() => findActionableLinkStoryblok(link), [link])

    const runLinkAction = useCallback(() => {
        if (!actionLink) return
        const action = parseLinkAction(actionLink.action)
        if (action.type === 'copy') {
            void copyPageLink()
            return
        }
        if (action.type === 'popup' && action.popup === 'glossario') {
            if (glossary) glossary.open()
            else openPopup('glossario')
            return
        }
        if (action.type === 'popup' && action.popup) {
            openPopup(action.popup)
        }
    }, [actionLink, copyPageLink, glossary])

    if (actionLink) {
        const { className, 'aria-label': ariaLabel } = props

        return (
            <button
                ref={ref as React.Ref<HTMLButtonElement>}
                type="button"
                className={className}
                aria-label={ariaLabel}
                onClick={(event) => {
                    event.stopPropagation()
                    runLinkAction()
                }}
            >
                {children ?? actionLink.label}
            </button>
        )
    }

    // Se c'è un link Storyblok, usa quello, altrimenti usa href
    // Gestisce sia array che singolo link, sia StoryblokLink che LinkStoryblok
    let linkUrl: string | undefined
    if (link) {
        if (Array.isArray(link)) {
            for (const item of link) {
                if (!item) continue
                const url = getLinkUrlFromStoryblokInput(item)
                if (url) {
                    linkUrl = url
                    break
                }
            }
        } else {
            linkUrl = getLinkUrlFromStoryblokInput(link) || undefined
        }
    }

    // Se non c'è linkUrl da link, usa href
    if (!linkUrl) {
        linkUrl = href
    }

    const handleProductTransitionClick = (
        event: React.MouseEvent<HTMLAnchorElement>,
        navigationHref: string,
    ) => {
        onClick?.(event)
        if (event.defaultPrevented || !productTransitionId || !productViewTransition) return

        event.preventDefault()
        const root =
            event.currentTarget.closest('article') ??
            event.currentTarget.closest('[data-product-card]') ??
            event.currentTarget
        const sourceImage = root.querySelector<HTMLElement>(
            `[data-vt-product-image="${productTransitionId}"]`,
        )
        productViewTransition.navigateToProduct(
            navigationHref,
            productTransitionId,
            sourceImage,
        )
    }

    const linkClickProps = (navigationHref: string) =>
        productTransitionId
            ? {
                  onClick: (event: React.MouseEvent<HTMLAnchorElement>) =>
                      handleProductTransitionClick(event, navigationHref),
              }
            : { onClick }

    // Se non c'è URL valido, renderizza un div
    // Rimuovi le props specifiche di link/anchor che non sono valide per un div
    if (!linkUrl) {
        const { target, replace, href, ...divProps } = props as any
        return (
            <div ref={ref as React.Ref<HTMLDivElement>} {...(divProps as React.HTMLAttributes<HTMLDivElement>)}>
                {children}
            </div>
        )
    }

    // Se è un anchor link (inizia con #), passa direttamente
    if (linkUrl.startsWith('#')) {
        return (
            <Link ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} onClick={onClick}>
                {children}
            </Link>
        )
    }

    // Se è un URL esterno (http/https), passa direttamente
    if (linkUrl.match(/^https?:\/\//i)) {
        return (
            <a ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} onClick={onClick} target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        )
    }

    // Se l'URL inizia con www., trattalo come URL esterno
    if (linkUrl.match(/^www\./i)) {
        return (
            <a ref={ref as React.Ref<HTMLAnchorElement>} href={`https://${linkUrl}`} {...props} onClick={onClick} target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        )
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

            return (
                <Link
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    href={pathWithoutLocale}
                    locale={detectedLocale}
                    prefetch={productTransitionId ? true : undefined}
                    {...props}
                    {...linkClickProps(linkUrl)}
                >
                    {children}
                </Link>
            )
        }
    }

    // If URL starts with / but no locale detected, process normally
    if (linkUrl.startsWith('/')) {
        // Regular internal link without locale prefix
        return (
            <Link
                ref={ref as React.Ref<HTMLAnchorElement>}
                href={linkUrl}
                prefetch={productTransitionId ? true : undefined}
                {...props}
                {...linkClickProps(linkUrl)}
            >
                {children}
            </Link>
        )
    }

    // Se l'URL non inizia con / e non ha locale, potrebbe essere un percorso relativo
    // Normalizzalo aggiungendo / all'inizio per renderlo assoluto
    const normalizedUrl = linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl
    return (
        <Link
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={normalizedUrl}
            prefetch={productTransitionId ? true : undefined}
            {...props}
            {...linkClickProps(normalizedUrl)}
        >
            {children}
        </Link>
    )
})

SmartLink.displayName = 'SmartLink'

export default SmartLink

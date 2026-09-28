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

type LinkProps = ComponentProps<typeof Link>

interface SmartLinkProps extends Omit<LinkProps, 'href'> {
  href?: string
  link?: unknown
  children?: React.ReactNode
}

const SmartLink = forwardRef<
  HTMLAnchorElement | HTMLDivElement | HTMLButtonElement,
  SmartLinkProps
>(({ href, link, children, onClick, ...props }, ref) => {
  const locales = routing.locales
  const glossary = useGlossary()
  const { copyPageLink } = useCopyPageLink()

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

  if (!linkUrl) {
    linkUrl = href
  }

  if (!linkUrl) {
    const { target, replace, href: _href, ...divProps } = props as any
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        {...(divProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    )
  }

  if (linkUrl.startsWith('#')) {
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (linkUrl.match(/^https?:\/\//i)) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={linkUrl}
        {...props}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  if (linkUrl.match(/^www\./i)) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={`https://${linkUrl}`}
        {...props}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  const match = linkUrl.match(/^\/?([a-z]{2})(\/|$)/)

  if (match) {
    const detectedLocale = match[1]
    if (locales.includes(detectedLocale as any)) {
      let pathWithoutLocale = linkUrl
        .replace(/^\/?/, '')
        .replace(new RegExp(`^${detectedLocale}(/|$)`), '') || '/'

      if (
        pathWithoutLocale &&
        pathWithoutLocale !== '/' &&
        !pathWithoutLocale.startsWith('/')
      ) {
        pathWithoutLocale = '/' + pathWithoutLocale
      }

      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={pathWithoutLocale}
          locale={detectedLocale}
          {...props}
          onClick={onClick}
        >
          {children}
        </Link>
      )
    }
  }

  if (linkUrl.startsWith('/')) {
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={linkUrl} {...props} onClick={onClick}>
        {children}
      </Link>
    )
  }

  const normalizedUrl = linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl
  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={normalizedUrl}
      {...props}
      onClick={onClick}
    >
      {children}
    </Link>
  )
})

SmartLink.displayName = 'SmartLink'

export default SmartLink

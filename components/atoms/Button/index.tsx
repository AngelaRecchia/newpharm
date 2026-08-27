'use client'

import { forwardRef } from 'react'
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { storyblokEditable } from '@storyblok/react'
import { useTranslations } from 'next-intl'
import { LinkStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles);

import { icons } from '../Icon/icons'
import Icon from '../Icon'
import SmartLink from '../SmartLink'
import { StoryblokLink, getFirstValidLink, isLinkStoryblokBlok, isLinkStoryblokValid } from '@/lib/api/utils/links'
import { openPopup, parseLinkAction, type LinkActionValue } from '@/lib/link-action'
import { useCopyPageLink } from '@/lib/use-copy-page-link'

export interface ButtonProps {
    icon?: keyof typeof icons
    label?: string
    onClick?: () => void
    /** Solo per `<button>` (non link) */
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
    disabled?: boolean
    onFocus?: () => void
    className?: string
    href?: string
    target?: string
    link?: (StoryblokLink & { anchor?: string }) | LinkStoryblok | LinkStoryblok[] | null
    variant?: 'primary' | 'secondary' | 'tertiary'
    size?: 'small' | 'medium',
    weight?: 'normal' | 'bold'
    animated?: boolean
    inert?: boolean
    /** Icona nel cerchio sempre visibile (no animazione hover desktop) */
    iconAlwaysVisible?: boolean
    iconPlain?: boolean
    iconRotate?: boolean
    'aria-label'?: string
    blok?: LinkStoryblok
}

function resolveLinkAction(link: ButtonProps['link'], blok?: LinkStoryblok): LinkActionValue {
    if (blok) return parseLinkAction(blok.action)
    if (Array.isArray(link)) {
        const firstValid = getFirstValidLink(link)
        return parseLinkAction(firstValid?.action)
    }
    if (isLinkStoryblokBlok(link)) return parseLinkAction(link.action)
    return parseLinkAction(undefined)
}

const Button = forwardRef<HTMLButtonElement | HTMLDivElement, ButtonProps>(({ icon = 'right-small', label: labelProp, onClick, onFocus, className, href, target, link, variant = 'primary', size = 'medium', weight = 'bold', animated = false, inert = false, iconAlwaysVisible = false, iconPlain = false, iconRotate = false, 'aria-label': ariaLabel, blok, type, disabled, ...props }, ref) => {
    const t = useTranslations('')
    const { copied, copyPageLink } = useCopyPageLink()
    const action = resolveLinkAction(link, blok)

    const editableProps = blok ? storyblokEditable(blok as any) : {}

    let extractedLabel: string | undefined = labelProp
    let extractedLink: (StoryblokLink & { anchor?: string }) | null = null

    if (link) {
        if (Array.isArray(link)) {
            const firstValid = getFirstValidLink(link)
            if (firstValid) {
                extractedLabel = extractedLabel || firstValid.label || undefined
                extractedLink = firstValid.link as StoryblokLink & { anchor?: string }
            }
        }
        else if (isLinkStoryblokBlok(link)) {
            if (isLinkStoryblokValid(link)) {
                extractedLabel = extractedLabel || link.label || undefined
                extractedLink = link.link as StoryblokLink & { anchor?: string }
            }
        }
        else {
            extractedLink = link as StoryblokLink & { anchor?: string }
        }
    }

    const isCopy = action.type === 'copy'
    const isPopup = action.type === 'popup'
    const isActionButton = isCopy || isPopup

    if (isCopy) {
        extractedLabel = copied ? t('link_copied') : (extractedLabel || t('copy_link'))
    }

    const resolvedIcon = isCopy && icon === 'right-small' ? 'url' : icon

    const hasLabel = extractedLabel && extractedLabel.length > 0
    const hasIcon = resolvedIcon && resolvedIcon.length > 0 && icons[resolvedIcon]
    const onlyIcon = hasIcon && !hasLabel

    const isExternalLink = extractedLink
        ? (extractedLink.linktype === 'url' || extractedLink.linktype === 'external')
        : (href && (href.match(/^https?:\/\//i) || href.match(/^www\./i)))

    const linkTarget = extractedLink?.linktype === 'url' || extractedLink?.linktype === 'external' ? target || '_blank' : target

    const isLeftIcon = resolvedIcon === 'chevron-left'
    const isArrowIcon = resolvedIcon === 'right' || resolvedIcon === 'right-small'

    const buttonClasses = cn('button', {
        buttonPrimary: variant === 'primary',
        buttonSecondary: variant === 'secondary',
        buttonTertiary: variant === 'tertiary',
        buttonIconOnly: onlyIcon,
        buttonWithLabel: hasLabel,
        buttonWithIcon: hasLabel && hasIcon,
        buttonSizeSmall: size === 'small',
        buttonSizeMedium: size === 'medium',
        animated: animated,
        iconAlwaysVisible,
        iconPlain,
        iconRotate,
        'button-left': animated && isLeftIcon,
        'button-external': onlyIcon && isArrowIcon && isExternalLink,
    }, className)

    const children = (
        <>
            {hasLabel && <span>{extractedLabel}</span>}
            {onlyIcon && (
                <Icon
                    type={resolvedIcon}
                    size={resolvedIcon === 'hamburger' ? 'l' : 'm'}
                    weight={weight}
                    className={resolvedIcon === 'hamburger' ? undefined : cn('iconOnly')}
                />
            )}
            {hasLabel && hasIcon && (
                <div className={cn('buttonIcon')}>
                    <Icon type={resolvedIcon} size="s" weight={weight} />
                </div>
            )}
        </>
    )

    const handleClick = () => {
        if (isCopy) {
            void copyPageLink()
            return
        }
        if (isPopup && action.popup) {
            openPopup(action.popup)
            return
        }
        onClick?.()
    }

    const sharedProps = {
        className: buttonClasses,
        'aria-label': ariaLabel || (isCopy ? t('copy_link') : undefined),
        'data-button': true,
        onFocus,
        ...editableProps,
        ...props,
    }

    if (inert) {
        return (
            <div ref={ref as React.Ref<HTMLDivElement>} {...sharedProps}>
                {children}
            </div>
        )
    }

    if (!isActionButton && (extractedLink || href)) {
        return (
            <SmartLink
                ref={ref as React.Ref<HTMLAnchorElement | HTMLDivElement>}
                link={extractedLink}
                href={href}
                target={linkTarget}
                {...sharedProps}
            >
                {children}
            </SmartLink>
        )
    }

    return (
        <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type={type}
            disabled={disabled}
            onClick={handleClick}
            {...sharedProps}
        >
            {children}
        </button>
    )
})

Button.displayName = 'Button'

export default Button

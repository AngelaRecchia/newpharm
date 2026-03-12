import { forwardRef } from 'react'
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { storyblokEditable } from '@storyblok/react'
import { LinkStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles);

import { icons } from '../Icon/icons'
import Icon from '../Icon'
import SmartLink from '../SmartLink'
import { StoryblokLink, getFirstValidLink, isLinkStoryblokValid } from '@/lib/api/utils/links'

export interface ButtonProps {
    icon?: keyof typeof icons
    label?: string
    onClick?: () => void
    className?: string
    href?: string
    target?: string
    link?: (StoryblokLink & { anchor?: string }) | LinkStoryblok | LinkStoryblok[] | null
    variant?: 'primary' | 'secondary' | 'tertiary'
    size?: 'small' | 'medium',
    weight?: 'normal' | 'bold'
    animated?: boolean
    inert?: boolean
    'aria-label'?: string
    /** Blok Storyblok completo (opzionale, per storyblokEditable) */
    blok?: LinkStoryblok
}
const Button = forwardRef<HTMLButtonElement | HTMLDivElement, ButtonProps>(({ icon = 'right-small', label: labelProp, onClick, className, href, target, link, variant = 'primary', size = 'medium', weight = 'bold', animated = false, inert = false, 'aria-label': ariaLabel, blok, ...props }, ref) => {
    // Se blok è presente, applica storyblokEditable
    const editableProps = blok ? storyblokEditable(blok as any) : {}

    // Estrae label e link da link prop se è LinkStoryblok o array
    let extractedLabel: string | undefined = labelProp
    let extractedLink: (StoryblokLink & { anchor?: string }) | null = null

    if (link) {
        // Se è un array di LinkStoryblok
        if (Array.isArray(link)) {
            const firstValid = getFirstValidLink(link)
            if (firstValid) {
                extractedLabel = extractedLabel || firstValid.label
                extractedLink = firstValid.link as StoryblokLink & { anchor?: string }
            }
        }
        // Se è un singolo LinkStoryblok
        else if ('label' in link && 'link' in link) {
            if (isLinkStoryblokValid(link)) {
                extractedLabel = extractedLabel || link.label || undefined
                extractedLink = link.link as StoryblokLink & { anchor?: string }
            }
        }
        // Se è un StoryblokLink diretto (compatibilità retroattiva)
        else {
            extractedLink = link as StoryblokLink & { anchor?: string }
        }
    }

    const hasLabel = extractedLabel && extractedLabel.length > 0
    const hasIcon = icon && icon.length > 0 && icons[icon]
    const onlyIcon = hasIcon && !hasLabel

    // Verifica se il link è esterno
    const isExternalLink = extractedLink
        ? (extractedLink.linktype === 'url' || extractedLink.linktype === 'external')
        : (href && (href.match(/^https?:\/\//i) || href.match(/^www\./i)))

    const linkTarget = extractedLink?.linktype === 'url' || extractedLink?.linktype === 'external' ? target || '_blank' : target

    // Rileva se l'icona è una freccia sinistra (per animazione inversa)
    const isLeftIcon = icon === 'chevron-left'

    // Rileva se l'icona è una freccia (right, right-small) per rotazione su link esterni
    const isArrowIcon = icon === 'right' || icon === 'right-small'

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
        'button-left': animated && isLeftIcon, // Classe per animazione verso sinistra
        'button-external': onlyIcon && isArrowIcon && isExternalLink, // Classe per rotazione icona su link esterni
    }, className)

    const children = (
        <>
            {hasLabel && <span>{extractedLabel}</span>}
            {onlyIcon && <Icon type={icon} size='m' weight={weight} />}
            {hasLabel && hasIcon && <div className={cn('buttonIcon')}><Icon type={icon} size='s' weight={weight} /></div>}
        </>
    )

    // Se inert è true, renderizza come div (solo visuale, non cliccabile)
    if (inert) {
        return (
            <div ref={ref as React.Ref<HTMLDivElement>} className={buttonClasses} aria-label={ariaLabel} {...editableProps} {...props}>
                {children}
            </div>
        )
    }

    // Renderizza come SmartLink se c'è un link o href, altrimenti come button
    if (extractedLink || href) {
        return (
            <SmartLink ref={ref as React.Ref<HTMLAnchorElement | HTMLDivElement>} link={extractedLink} href={href} target={linkTarget} className={buttonClasses} aria-label={ariaLabel} {...editableProps} {...props}>
                {children}
            </SmartLink>
        )
    }

    return (
        <button ref={ref as React.Ref<HTMLButtonElement>} onClick={onClick} className={buttonClasses} aria-label={ariaLabel} {...editableProps} {...props}>
            {children}
        </button>
    )
})

export default Button

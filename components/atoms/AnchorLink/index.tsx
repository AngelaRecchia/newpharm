'use client'

import SmartLink from '../SmartLink'
import Button from '../Button'
import styles from './index.module.scss'
import { getLinkUrl, StoryblokLink } from '@/lib/api/utils/links'
import { useMemo } from 'react'

interface AnchorLinkProps {
    href?: string | null
    link?: StoryblokLink & { anchor?: string } | null
    label: string | null
    description?: string | null
}

export default function AnchorLink({
    href,
    link,
    label,
    description,
}: AnchorLinkProps) {
    const linkType = useMemo(() => link?.linktype, [link])
    const icon = useMemo(() => linkType !== 'story' ? 'external' : link?.anchor ? 'down' : 'right-small', [link?.anchor, linkType])

    const { anchorLink, anchorLinkLabel, anchorLinkdescription, anchorLinkIcon, anchorLinkContent } = styles

    return (
        <SmartLink
            link={link}
            className={anchorLink}
        >
            <div className={anchorLinkContent}>
                <div className={anchorLinkLabel}>{label}</div>
                {description && (
                    <div className={anchorLinkdescription}>{description}</div>
                )}
            </div>
            <div className={anchorLinkIcon} aria-hidden="true">
                <Button
                    icon={icon}
                    variant='secondary'
                    size='small'
                />
            </div>
        </SmartLink>
    )
}

'use client'

import Link from 'next/link'
import Icon from '../Icon'
import { Nav_itemStoryblok } from '@/types/storyblok'
import classNames from 'classnames/bind'
import { AnimatePresence, motion } from 'motion/react'
import styles from './index.module.scss'
import { getLinkUrl } from '@/lib/api/utils/links'
import AnchorLink from '../AnchorLink'

const cn = classNames.bind(styles)

interface NavItemProps {
    item: Nav_itemStoryblok
    index: number
    expanded?: boolean
    variant?: 'transparent' | 'white'
    onToggle: (index: number) => void
}



const hasDropdown = (item: Nav_itemStoryblok) => {
    return item.items && item.items.length > 0
}

export default function NavItem({
    item,
    index,
    expanded = false,
    variant = 'transparent',
    onToggle,
}: NavItemProps) {
    const hasItems = hasDropdown(item)
    const hasLink = getLinkUrl(item.link)

    const linkClassName = cn('navLink', {
        navLinkWhite: variant === 'white',
        navLinkTransparent: variant === 'transparent',
    })

    const navItemClasses = cn('navItem', {
        navItemExpanded: expanded,
    })


    return (
        <li
            className={navItemClasses}

        >
            {hasLink ? (
                <Link
                    href={hasLink}
                    className={linkClassName}
                    onClick={() => hasItems && onToggle(index)}
                >
                    <span>{item.label}</span>
                    {hasItems && (
                        <div className={cn('navIcon')} aria-hidden="true">
                            <Icon type="chevron-down" />
                        </div>
                    )}
                </Link>
            ) : (
                <button
                    className={linkClassName}
                    aria-expanded={expanded}
                    onClick={() => hasItems && onToggle(index)}

                >
                    <span>{item.label}</span>
                    {hasItems && (
                        <div className={cn('navIcon')} aria-hidden="true">
                            <Icon type="chevron-down" />
                        </div>
                    )}
                </button>
            )}

            <AnimatePresence>
                {hasItems && expanded && item.items && (
                    <motion.ul
                        className={cn('dropdown')}



                    >
                        {item.items.map((subItem, subIndex) => (
                            <motion.li
                                key={subItem._uid}
                                className={cn('dropdownItem')}
                                initial={{ opacity: 0, y: 0 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, transition: { duration: .2, ease: 'easeOut' } }}
                                transition={{ duration: 0.2, delay: 0.02 * subIndex, ease: 'easeOut' }}
                            >
                                <AnchorLink
                                    link={subItem.link}
                                    label={subItem.label}
                                    description={subItem.description}
                                />
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </li>
    )
}

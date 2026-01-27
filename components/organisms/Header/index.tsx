'use client'

import { useState, useEffect } from 'react'

import { useViewport } from '@/lib/context/viewport-context'

import { getLinkUrl } from '@/lib/api/utils/links'
import { Nav_itemStoryblok } from '@/types/storyblok'

import { AnimatePresence, motion } from 'motion/react'

import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

import AnchorLink from '../../atoms/AnchorLink'
import Link from 'next/link'
import Icon from '../../atoms/Icon'
import Button from '../../atoms/Button'
import NavItem from '../../atoms/NavItem'


interface HeaderProps {
  navItems?: Nav_itemStoryblok[],
  variant?: 'transparent' | 'white'
}

export default function Header({
  navItems = [],
  variant = 'transparent',
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)

  const { isMobile } = useViewport()

  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index)
  }

  const [headerVariant, setHeaderVariant] = useState<'white' | 'transparent'>(variant)

  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      setHeaderVariant('white')
    } else {
      setHeaderVariant(variant)
    }
  }, [isMobile, mobileMenuOpen, variant])

  const headerClasses = cn('header', {
    headerWhite: headerVariant === 'white',
    headerTransparent: headerVariant === 'transparent',
  })

  useEffect(() => {
    document.addEventListener('keyup', handleEscape)
    return () => {
      document.removeEventListener('keyup', handleEscape)
    }
  }, [])

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenDropdownIndex(null)
    }
  }

  const closeMenu = () => {
    setOpenDropdownIndex(null)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className={headerClasses} data-transparent={variant === 'transparent'}>

        <div className={cn('headerContent')}>
          {/* Logo */}
          <div className={cn('headerLogo')}>
            <Link href="/" className={cn({
              "text-primary": variant === 'white',
              "text-white": variant === 'transparent',
            })}>
              <Icon type="logo" variant={headerVariant === 'white' ? 'primary-red' : 'white-red'} />
            </Link>
          </div>


          {/* Desktop Navigation */}
          <nav className={cn('headerNav')}>

            <ul className={cn('headerNavItems')}>
              {navItems.map((item, index) => (
                <NavItem
                  key={item._uid}
                  item={item}
                  index={index}
                  expanded={openDropdownIndex === index}
                  variant={variant}
                  onToggle={toggleDropdown}
                />
              ))}
            </ul>

            {/* Actions */}
            <div className={cn('headerActions')}>
              <Button icon="download" variant={isMobile ? 'tertiary' : 'primary'} className={isMobile ? 'bg-surface' : ''} />
              <Button icon='search' variant={isMobile ? 'tertiary' : 'primary'} className={isMobile ? 'bg-surface' : ''} />
              {isMobile && (
                <Button
                  icon={mobileMenuOpen ? 'close' : 'hamburger'}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                />
              )}
            </div>
          </nav>



          {/* Mobile Navigation */}

          <AnimatePresence>
            {mobileMenuOpen && (

              <motion.nav className={cn('headerMobileNavWrapper')} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}>
                <ul className={cn('headerMobileNav')} >
                  {navItems.map((item, index) => {
                    const hasItems = item.items && item.items.length > 0
                    const isOpen = openDropdownIndex === index
                    const hasLink = getLinkUrl(item.link)
                    return <li key={item._uid}>
                      {hasLink ? (
                        <Link
                          href={hasLink || '#'}
                          className={cn('headerMobileNavLink', 'headerMobileNavItem')}
                        >
                          {item.label}
                        </Link>)
                        : hasItems ? (
                          <button
                            onClick={() => toggleDropdown(index)}
                            className={cn('headerMobileNavItem', 'headerMobileToggle', {
                              headerMobileNavItemExpanded: isOpen,
                            })}
                          >
                            {item.label}
                            <Icon type='chevron-down' />
                          </button>
                        ) : <></>}


                      {/* Mobile Dropdown */}
                      <AnimatePresence>
                        {
                          hasItems && isOpen && item.items && (
                            <motion.ul className={cn('headerMobileDropdown')} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}>
                              {item.items.map((subItem) => (
                                <li key={subItem._uid}>
                                  <AnchorLink
                                    link={subItem.link}
                                    label={subItem.label}
                                    description={subItem.description}
                                  />
                                </li>
                              ))}
                            </motion.ul>
                          )
                        }</AnimatePresence>
                    </li>



                  })}



                </ul>

              </motion.nav>

            )}</AnimatePresence>
        </div>



      </header>

      <AnimatePresence>
        {((openDropdownIndex !== null && !isMobile) || (isMobile && mobileMenuOpen)) && (
          <motion.div
            onClick={() => closeMenu()}
            className={cn('headerOverlay', { headerWhite: variant === 'white' })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label="Dismiss menu"
          />
        )}
      </AnimatePresence>
    </>
  )
}
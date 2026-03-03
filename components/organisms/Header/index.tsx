'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useViewport } from '@/lib/context/viewport-context'

import { getLinkUrl } from '@/lib/api/utils/links'
import { HeaderStoryblok, Nav_itemStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'

import { AnimatePresence, motion } from 'motion/react'

import classNames from 'classnames/bind'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

import AnchorLink from '../../atoms/AnchorLink'
import SmartLink from '../../atoms/SmartLink'
import Icon from '../../atoms/Icon'
import Button from '../../atoms/Button'
import NavItem from '../../atoms/NavItem'


interface HeaderProps {
  blok?: HeaderStoryblok
  variant?: 'transparent' | 'white'
}

export default function Header({
  blok,
  variant = 'transparent',
}: HeaderProps) {
  const navItems = (blok?.nav_items as Nav_itemStoryblok[]) || []
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  const { isMobile } = useViewport()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleDropdown = (index: number) => {

    setOpenDropdownIndex(openDropdownIndex === index ? null : index)
  }

  const [headerVariant, setHeaderVariant] = useState<'white' | 'transparent'>(variant)
  const [scrolled, setScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // Gestisce lo scroll per cambiare variante e visibilità
  useEffect(() => {
    let lastScrollY = window.scrollY || window.pageYOffset
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset
          const viewportHeight = window.innerHeight
          const threshold = viewportHeight * 0.5 // 50vh

          // Determina la direzione dello scroll
          const isScrollingDown = scrollY > lastScrollY
          const scrollDelta = Math.abs(scrollY - lastScrollY)
          lastScrollY = scrollY

          // Se siamo all'inizio della pagina, mostra sempre l'header
          if (scrollY <= 10) {
            setIsHeaderVisible(true)
          } else if (scrollDelta > 5) {
            // Nascondi/mostra header in base alla direzione (solo se scroll significativo)
            setIsHeaderVisible(!isScrollingDown)
          }

          // Cambia variante a 50vh in entrambe le direzioni
          setScrolled(scrollY > threshold)

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Controlla lo stato iniziale

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Menu mobile ha priorità: se è aperto, forza bianco e mantieni visibile
    if (isMobile && mobileMenuOpen) {
      setHeaderVariant('white')
      setIsHeaderVisible(true)
    } else if (scrolled) {
      // Se scrollato oltre 50vh, usa bianco
      setHeaderVariant('white')
    } else {
      // Altrimenti usa la variante originale
      setHeaderVariant(variant)
    }
  }, [isMobile, mobileMenuOpen, variant, scrolled])

  // Aggiorna la variabile CSS --sticky-top in base alla visibilità dell'header
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (isHeaderVisible) {
        root.style.setProperty('--sticky-top', 'var(--header-height)')
      } else {
        root.style.setProperty('--sticky-top', '0')
      }
    }
  }, [isHeaderVisible])




  const headerClasses = cn('header', {
    headerWhite: headerVariant === 'white',
    headerTransparent: headerVariant === 'transparent',
    headerHidden: !isHeaderVisible,
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



  if (!blok) return <></>

  return (
    <>
      <header className={headerClasses} data-transparent={variant === 'transparent'} {...storyblokEditable(blok as any)}>

        <div className={cn('headerContent')}>
          {/* Logo */}
          <div className={cn('headerLogo')}>
            <SmartLink href="/" className={cn({
              "text-primary": variant === 'white',
              "text-white": variant === 'transparent',
            })}>
              <Icon type="logo" variant={headerVariant === 'white' ? 'primary-red' : 'white-red'} />
            </SmartLink>
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
                        <SmartLink
                          link={item.link}
                          className={cn('headerMobileNavLink', 'headerMobileNavItem')}
                        >
                          {item.label}
                        </SmartLink>)
                        : hasItems ? (
                          <button
                            onClick={() => toggleDropdown(index)}
                            className={cn('headerMobileNavItem', 'headerMobileToggle', {
                              headerMobileNavItemExpanded: isOpen,
                            })}
                          >
                            {item.label}
                            <Icon type='chevron-down' size='ml' />
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

      {mounted && createPortal(
        <AnimatePresence mode="wait">
          {((openDropdownIndex !== null && !isMobile) || (isMobile && mobileMenuOpen)) && (
            <motion.div
              key="header-overlay"
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
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
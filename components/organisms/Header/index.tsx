'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useViewport } from '@/lib/context/viewport-context'
import { useGlobalSettings } from '@/lib/context/global-settings-context'

import { getLinkUrl } from '@/lib/api/utils/links'
import { HeaderStoryblok, Nav_itemStoryblok } from '@/types/storyblok'
import { storyblokEditable } from '@storyblok/react'

import { AnimatePresence, motion } from 'motion/react'

import { useTranslations } from 'next-intl'
import classNames from 'classnames/bind'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import styles from './index.module.scss'

const cn = classNames.bind(styles)

import AnchorLink from '../../atoms/AnchorLink'
import SmartLink from '../../atoms/SmartLink'
import Icon from '../../atoms/Icon'
import Button from '../../atoms/Button'
import NavItem from '../../atoms/NavItem'
import SearchMenu from '../../molecules/SearchMenu'


interface HeaderProps {
  blok?: HeaderStoryblok
  variant?: 'transparent' | 'white'
}

export default function Header({
  blok,
  variant = 'transparent',
}: HeaderProps) {
  const t = useTranslations()
  const settings = useGlobalSettings()
  const navItems = (blok?.nav_items as Nav_itemStoryblok[]) || []
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchOpenRef = useRef(searchOpen)
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    searchOpenRef.current = searchOpen
  }, [searchOpen])

  const { isMobile } = useViewport()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Blocca lo scroll solo per i dropdown desktop. Search e menu mobile
  // rimangono scrollabili per evitare il saltino causato dall'header fixed
  // quando la scrollbar scompare/riappare.
  const shouldLockBodyScroll = openDropdownIndex !== null && !isMobile
  useBodyScrollLock(shouldLockBodyScroll)

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

          // Se il menu di ricerca è aperto, mantieni l'header sempre visibile
          if (searchOpenRef.current) {
            setIsHeaderVisible(true)
          } else if (scrollY <= 10) {
            // Se siamo all'inizio della pagina, mostra sempre l'header
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
    // Menu mobile o search aperti hanno priorità: forza bianco e mantieni visibile
    if ((isMobile && mobileMenuOpen) || searchOpen) {
      setHeaderVariant('white')
      setIsHeaderVisible(true)
    } else if (scrolled) {
      // Se scrollato oltre 50vh, usa bianco
      setHeaderVariant('white')
    } else {
      // Altrimenti usa la variante originale
      setHeaderVariant(variant)
    }
  }, [isMobile, mobileMenuOpen, searchOpen, variant, scrolled])

  // Aggiorna --sticky-top in sync con l'animazione hide/show dell'header (300ms)
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const headerHeight =
      getComputedStyle(root).getPropertyValue('--header-height').trim() || '4.25rem'

    root.style.setProperty('--sticky-top', isHeaderVisible ? headerHeight : '0px')
  }, [isHeaderVisible])




  // Se search o menu mobile sono aperti, l'header deve rimanere visibile
  // (non applicare headerHidden) perché i relativi pannelli sono renderizzati
  // al suo interno.
  const isOverlayOpen = searchOpen || (isMobile && mobileMenuOpen)
  const headerClasses = cn('header', {
    headerWhite: headerVariant === 'white',
    headerTransparent: headerVariant === 'transparent',
    headerHidden: !isHeaderVisible && !isOverlayOpen,
    headerSearchOpen: isOverlayOpen,
  })

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMenu()
    }
  }

  useEffect(() => {
    document.addEventListener('keyup', handleEscape)
    return () => {
      document.removeEventListener('keyup', handleEscape)
    }
  }, [])

  const closeMenu = () => {
    setOpenDropdownIndex(null)
    setMobileMenuOpen(false)
    setSearchOpen(false)
  }



  if (!blok) return <></>

  const searchPage = blok.search_page

  return (
    <>
      <header className={headerClasses} data-transparent={variant === 'transparent'} {...storyblokEditable(blok as any)}>

        <div className={cn('headerContent', { headerContentSearchOpen: searchOpen })}>
          {/* Logo */}
          <div className={cn('headerLogo')}>
            <SmartLink href="/" aria-label={t('home')} className={cn({
              "text-primary": headerVariant === 'white',
              "text-white": headerVariant === 'transparent',
            })}>
              <Icon type="logo" variant={headerVariant === 'white' ? 'primary-red' : 'white-red'} />
            </SmartLink>
          </div>


          {/* Desktop Navigation */}
          <nav className={cn('headerNav')}>

            <ul className={cn('headerNavItems')}>
              {navItems.map((item, index) => (
                <NavItem
                  key={item._uid ?? `nav-item-${index}`}
                  item={item}
                  index={index}
                  expanded={openDropdownIndex === index}
                  variant={headerVariant}
                  onToggle={toggleDropdown}
                />
              ))}
            </ul>

            {/* Actions */}
            <div className={cn('headerActions')}>
              <Button icon="download" aria-label={t('download')} variant={isMobile ? 'tertiary' : 'primary'} className={isMobile ? 'bg-surface' : ''} />
              <Button
                icon={searchOpen ? 'close' : 'search'}
                aria-label={searchOpen ? t('close') : t('search')}
                variant={isMobile ? 'tertiary' : 'primary'}
                className={isMobile ? 'bg-surface' : ''}
                onClick={() => {
                  setSearchOpen((open) => !open)
                  setMobileMenuOpen(false)
                  setOpenDropdownIndex(null)
                }}
              />
              {isMobile && (
                <Button
                  icon={mobileMenuOpen ? 'close' : 'hamburger'}
                  aria-label={t('menu')}
                  onClick={() => {
                    if (mobileMenuOpen) closeMenu()
                    else {
                      setSearchOpen(false)
                      setMobileMenuOpen(true)
                    }
                  }}
                />
              )}
            </div>
          </nav>



          {/* Mobile Navigation */}

          <AnimatePresence>
            {mobileMenuOpen && (

              <motion.nav
                className={cn('headerMobileNavWrapper')}
                data-lenis-prevent
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <ul className={cn('headerMobileNav')} >
                  {navItems.map((item, index) => {
                    const hasItems = item.items && item.items.length > 0
                    const isOpen = openDropdownIndex === index
                    const hasLink = getLinkUrl(item.link)
                    return <li key={item._uid ?? `mobile-nav-${index}`}>
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
                              {item.items.map((subItem, subIndex) => (
                                <li key={subItem._uid ?? `mobile-subnav-${index}-${subIndex}`}>
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

        <SearchMenu
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            searchPage={searchPage}
            suggestedSearches={settings?.search_suggestions}
        />
      </header>

      {mounted && createPortal(
        <AnimatePresence mode="wait">
          {((openDropdownIndex !== null && !isMobile) || (isMobile && mobileMenuOpen) || searchOpen) && (
            <motion.div
              key="header-overlay"
              onClick={() => closeMenu()}
              className={cn('headerOverlay', { headerWhite: variant === 'white', headerOverlaySearch: searchOpen })}
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
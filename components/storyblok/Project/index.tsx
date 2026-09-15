'use client'

import dynamic from 'next/dynamic'
import { StoryblokComponent, storyblokEditable } from '@storyblok/react'
import type { AssetStoryblok, Cta_boxStoryblok, HeroStoryblok, LinkStoryblok, ListingStoryblok, ProjectStoryblok } from '@/types/storyblok'
import { useTranslations } from 'next-intl'
import classNames from 'classnames/bind'
import styles from './index.module.scss'

const Hero = dynamic(() => import('@/components/organisms/Hero'))
const Listing = dynamic(() => import('@/components/organisms/Listing'))
const CtaBox = dynamic(() => import('@/components/organisms/CtaBox'))

const cn = classNames.bind(styles)

function projectAssets(blok: ProjectStoryblok): AssetStoryblok[] | undefined {
  if (blok.asset && blok.asset.length > 0) return blok.asset
  if (blok.image && blok.image.length > 0) return blok.image
  return undefined
}

export default function Project({ blok }: { blok: ProjectStoryblok }) {
  const t = useTranslations('')
  const heroBlok: HeroStoryblok = {
    _uid: `${blok._uid}-hero`,
    component: 'hero',
    variant: 'primary',
    title: blok.title,
    subtitle: blok.short_description || undefined,
    background: projectAssets(blok),
  }

  const relatedProductsItems = blok.related_products?.resolved_items ?? []
  const showRelatedProductsListing = blok.show_related_products_listing !== false

  // Listing highlight: mostra TUTTI i prodotti del progetto (manuale o per categoria),
  // non limitato come il carousel (max 8 iniziali + "carica altri").
  // È condizionato dal booleano `show_related_products_listing` del CMS.
  const productsListingBlok: ListingStoryblok = {
    _uid: `${blok._uid}-prodotti-in-progetto`,
    component: 'listing',
    type: 'highlight',
    title: t('prodotti_in_progetto'),
    resolved_items: relatedProductsItems,
  }

  // CTA box automatica in pagina progetto quando l'ultimo modulo del body è
  // projects_highlight: viene iniettata subito prima di esso.
  const autoCtaBox: Cta_boxStoryblok = {
    _uid: `${blok._uid}-auto-cta`,
    component: 'cta_box',
    cards: [
      {
        _uid: `${blok._uid}-auto-cta-contact`,
        component: 'card_cta_box',
        title: t('chiedi_supporto_esperto'),
        color: 'blue',
        link: [
          {
            _uid: `${blok._uid}-auto-cta-contact-link`,
            component: 'link',
            label: t('contact_us'),
            action: { type: 'popup', popup: 'contattaci' },
          } as LinkStoryblok,
        ],
      },
      {
        _uid: `${blok._uid}-auto-cta-job`,
        component: 'card_cta_box',
        title: t('entra_nel_team'),
        color: 'black',
        link: [
          {
            _uid: `${blok._uid}-auto-cta-job-link`,
            component: 'link',
            label: t('candidati'),
            action: { type: 'popup', popup: 'job' },
          } as LinkStoryblok,
        ],
      },
    ],
  }

  const body = blok.body ?? []
  const lastBodyIndex = body.length - 1
  const projectsHighlightIndex =
    lastBodyIndex >= 0 && body[lastBodyIndex]?.component === 'projects_highlight'
      ? lastBodyIndex
      : -1

  const bodyNodes: React.ReactNode[] = []
  body.forEach((nestedBlok, index) => {
    if (index === projectsHighlightIndex) {
      // Inietta listing prodotti e CTA box prima del projects_highlight finale
      if (showRelatedProductsListing && relatedProductsItems.length > 0) {
        bodyNodes.push(
          <div
            key={`${blok._uid}-related-products`}
            className={cn('related-products')}
          >
            <Listing blok={productsListingBlok} />
          </div>
        )
      }
      bodyNodes.push(<CtaBox key={`${blok._uid}-auto-cta`} blok={autoCtaBox} />)
    }

    bodyNodes.push(
      <StoryblokComponent
        blok={nestedBlok}
        key={`${nestedBlok._uid}-${index}`}
      />
    )
  })

  return (
    <div {...storyblokEditable(blok as any)}>
      <Hero blok={heroBlok} />
      <div className={cn('body')}>
        {bodyNodes}

        {/* Fallback: se projects_highlight non è l'ultimo modulo, mostra i prodotti
            correlati in fondo come comportamento precedente (solo se abilitato). */}
        {showRelatedProductsListing &&
          projectsHighlightIndex === -1 &&
          relatedProductsItems.length > 0 && (
            <div className={cn('related-products')}>
              <Listing blok={productsListingBlok} />
            </div>
          )}
      </div>
    </div>
  )
}

'use client'

import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { ProductStoryblok } from '@/types/storyblok'
import Asset from '@/components/atoms/Asset'
import { useTranslations } from 'next-intl'
import Tag from '@/components/atoms/Tag'
import Breadcrumbs from '@/components/atoms/Breadcrumbs'
import AccordionItem from '@/components/atoms/AccordionItem'
import RichText from '@/components/organisms/RichText'
import SmartLink from '@/components/atoms/SmartLink'
import Icon from '@/components/atoms/Icon'
import VideoYt from '@/components/organisms/VideoYt'
import { StoryblokComponent } from '@storyblok/react'

const cn = classNames.bind(styles)

const Product = ({ blok }: { blok: ProductStoryblok }) => {
  const t = useTranslations('')
  const {
    title,
    secondary_title,
    images,
    short_description,
    features,
    product_type,
    category,
    application_areas_text,
    composition,
    dosage_and_application,
    units_per_carton,
    registration,
    safety_data_sheet,
    video,
    body,
    related_projects
  } = blok as any


  // Immagine principale = primo asset, secondarie = resto dell'array
  const mainImage = Array.isArray(images) && images.length > 0 ? [images[0]] : images
  const secondaryImages = Array.isArray(images) && images.length > 1 ? images.slice(1) : []

  const breadcrumbs = [
    { label: t('home'), href: '/' },
    { label: t('products'), href: '/' + t('products').toLowerCase() },
    { label: title },
  ]
  // Renderizza il contenuto di un accordion in base al tipo
  const renderAccordionContent = (item: { content: any; type: 'richtext' | 'text' | 'file' }) => {
    switch (item.type) {
      case 'richtext':
        return <RichText content={item.content} raw />
      case 'text':
        return <p>{item.content as string}</p>
      case 'file':
        return (
          <SmartLink
            href={(item.content as any).filename}
            className={cn('download-link')}
          >
            <Icon type="external" size="s" weight="normal" />
            <span>{(item.content as any).name || t('product_download')}</span>
          </SmartLink>
        )
      default:
        return null
    }
  }

  // Verifica se un contenuto è effettivamente valorizzato
  const hasContent = (content: any, type: string): boolean => {
    if (!content) return false
    if (type === 'richtext' && typeof content === 'object') {
      return Array.isArray(content.content) && content.content.length > 0
    }
    if (type === 'file') {
      return !!(content as any).filename
    }
    return !!content
  }

  // Accordion items — solo quelli con contenuto
  const accordionItems = [
    { label: t('product_application-areas'), content: application_areas_text, type: 'richtext' as const },
    { label: t('product_composition'), content: composition, type: 'text' as const },
    { label: t('product_target-pests'), content: null, type: 'text' as const },
    { label: t('product_dosage'), content: dosage_and_application, type: 'richtext' as const },
    { label: t('product_units-per-carton'), content: units_per_carton, type: 'richtext' as const },
    { label: t('product_download'), content: safety_data_sheet, type: 'file' as const },
  ].filter(item => hasContent(item.content, item.type))

  return (
    <section className={cn('wrapper')}>

      <div className={cn('sticky-section')}>
        {/* Colonna sinistra — immagine prodotto */}
        <div className={cn('image-col')}>
          <div className={cn('tag')}>
            <Tag tag={t(category)} variant="primary" />
          </div>
          <div className={cn('product-image')}>
            <Asset asset={mainImage} mode="fit" />
          </div>
        </div>

        {/* Colonna destra — contenuto */}
        <div className={cn('content-col')}>

          <Breadcrumbs items={breadcrumbs} />

          {/* Blocco titoli */}
          <div className={cn('title-block')}>
            {secondary_title && (
              <span className={cn('secondary-title')}>{secondary_title}</span>
            )}
            <h1 className={cn('title')}>{title}</h1>
            {short_description && (
              <p className={cn('description')}>{short_description}</p>
            )}
          </div>

          {/* Immagini secondarie — griglia affiancata */}
          {secondaryImages.length > 0 && (
            <div className={cn('secondary-images')}>
              {secondaryImages.map((img: any, i: number) => (
                <div key={i} className={cn('secondary-image')}>
                  <Asset asset={[img]} size="m" />
                </div>
              ))}
            </div>
          )}

          {/* Caratteristiche — richtext a due colonne */}
          {features && (
            <div className={cn('features-section')}>
              <h2 className={cn('features-heading')}>{t('product_features')}</h2>
              <div className={cn('features-text')}>
                <RichText content={features} raw />
              </div>
            </div>
          )}

          {/* Accordion */}
          {accordionItems.length > 0 && (
            <div className={cn('accordions')}>
              {accordionItems.map((item, i) => (
                <AccordionItem key={i} label={item.label}>
                  {renderAccordionContent(item)}
                </AccordionItem>
              ))}
            </div>
          )}

          {/* Note — registrazione + tipo prodotto */}
          {(registration || product_type) && (
            <div className={cn('note')}>
              {registration && <span>{registration}</span>}
              {product_type && <span>{product_type}</span>}
            </div>
          )}
        </div>

      </div>
      {video && <VideoYt videoId={video} />}

      {body && (
        <div className={cn('body')}>
          {body.map((item: any) => (
            <StoryblokComponent blok={item} key={item._uid} />
          ))}
        </div>
      )}

      {/* Progetti correlati — query inversa da page.tsx */}
      {related_projects && related_projects.length > 0 && (
        <div className={cn('related-projects')}>
          <h2 className={cn('related-projects-title')}>{t('product_related-projects')}</h2>
          <div className={cn('related-projects-grid')}>
            {related_projects.map((project: any) => (
              <SmartLink key={project.full_slug} href={`/${project.full_slug}`} className={cn('project-card')}>
                <div className={cn('project-card-image')}>
                  <Asset asset={project.asset} size="m" overlay />
                </div>
                <span className={cn('project-card-title')}>{project.title}</span>
              </SmartLink>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default Product

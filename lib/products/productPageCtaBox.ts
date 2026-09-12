import type { Cta_boxStoryblok, LinkStoryblok } from '@/types/storyblok'
import type { RelatedProject } from '@/lib/api/storyblok/stories'

/**
 * Costruisce un LinkStoryblok con azione.
 * Le label possono essere chiavi i18n (risolte dal componente Button lato client)
 * oppure testo già tradotto (se il chiamante lo risolve server-side).
 */
function buildLink(uid: string, label: string, action: LinkStoryblok['action']): LinkStoryblok {
  return {
    _uid: uid,
    component: 'link',
    label,
    action,
  }
}

/**
 * Crea lo story-link verso un progetto correlato.
 * Usa cached_url/full_slug per i18n: SmartLink/Button risolvono la locale.
 */
function projectLink(uid: string, label: string, slug: string): LinkStoryblok {
  return {
    _uid: uid,
    component: 'link',
    label,
    action: { type: 'link', popup: null },
    link: {
      id: '',
      url: '',
      linktype: 'story',
      fieldtype: 'multilink',
      cached_url: `/${slug}`,
    },
  }
}

export interface ProductPageCtaBoxLabels {
  box1Title: string
  box2Title: string
  copyLabel: string
  contactLabel: string
  projectLabel: string
}

/**
 * Costruisce il CTA box automatico per la pagina prodotto.
 *
 * - Card 1: copia link (azione "copy")
 * - Card 2: apri modale "contattaci" (azione "popup")
 * - Card 3: link alla pagina del primo progetto correlato, con immagine progetto
 *
 * Le label possono essere chiavi i18n (risolte lato client da `useTranslations`)
 * o stringhe già tradotte server-side.
 *
 * @param relatedProjects progetti che referenziano il prodotto (query inversa)
 * @param labels label/traduzioni per le card
 * @returns blok Cta_boxStoryblok con due card fisse e una card progetto opzionale
 */
export function buildProductPageCtaBox(
  relatedProjects: RelatedProject[],
  labels: ProductPageCtaBoxLabels,
): Cta_boxStoryblok | null {
  if (!relatedProjects || relatedProjects.length === 0) {
    return null;
  }
  const project = relatedProjects[0]

  const baseUid = 'product-page-auto-cta'

  const cards: Cta_boxStoryblok['cards'] = [
    {
      _uid: `${baseUid}-copy`,
      component: 'card_cta_box',
      title: labels.box1Title,
      color: 'black',
      link: [buildLink(`${baseUid}-copy-link`, labels.copyLabel, { type: 'copy', popup: null })],
    },
    {
      _uid: `${baseUid}-contact`,
      component: 'card_cta_box',
      title: labels.box2Title,
      color: 'blue',
      link: [
        buildLink(`${baseUid}-contact-link`, labels.contactLabel, {
          type: 'popup',
          popup: 'contattaci',
        }),
      ],
    },
  ]

  if (project) {
    cards.push({
      _uid: `${baseUid}-project`,
      component: 'card_cta_box',
      title: project.title,
      color: 'white',
      image: project.image[0] ?? null,
      link: [
        projectLink(
          `${baseUid}-project-link`,
          labels.projectLabel,
          project.full_slug,
        ),
      ],
    })
  }

  return {
    _uid: baseUid,
    component: 'cta_box',
    cards,
  }
}
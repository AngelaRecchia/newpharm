/**
 * Campi Storyblok da escludere per fetch listing (`getStoriesByComponent`).
 * Allineati a map*ToCard, filterListingByVista, compare e indici correlati.
 *
 * @see https://www.storyblok.com/docs/api/content-delivery/v2#parameters/excluding-fields
 */

const PRODUCT_LISTING_EXCLUDE =
  'body,usage,dimensions,registration,secondary_title,features,formulazione,product_type,tab_filtri,tab_dettaglio,tab_media,video,tab-cd7f2c9c-47a9-4630-a228-1739262250da'

const PROJECT_LISTING_EXCLUDE = 'body'

const STORY_LISTING_EXCLUDE = 'body,author,reading_time'

const JOB_LISTING_EXCLUDE = 'description,short_description'

const INSECT_LISTING_EXCLUDE = 'category'

/** Downloadable: payload già piccolo — nessuna esclusione. */

const EXCLUDING_BY_COMPONENT: Record<string, string | undefined> = {
  product: PRODUCT_LISTING_EXCLUDE,
  project: PROJECT_LISTING_EXCLUDE,
  story: STORY_LISTING_EXCLUDE,
  job: JOB_LISTING_EXCLUDE,
  insect: INSECT_LISTING_EXCLUDE,
}

export function getExcludingFieldsForComponent(component: string): string | undefined {
  return EXCLUDING_BY_COMPONENT[component]
}

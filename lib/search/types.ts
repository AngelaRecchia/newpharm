export type SearchDocumentType = 'product' | 'project' | 'story' | 'downloadable'

export interface SearchDocument {
  objectID: string
  uuid: string
  type: SearchDocumentType
  locale: string
  slug: string
  name: string
  title: string
  secondary_title?: string | null
  description?: string | null
  image?: unknown
  category?: string | null
  tags?: string[]

  /** Progetto — divisioni selezionate */
  divisions?: string[]

  /** Story — testo pulito estratto dai moduli in body */
  body_text?: string | null

  /** Prodotti correlati (project/story) — titoli risolti o tag categoria */
  related_product_names?: string[]
  related_category_tag?: string | null

  /** Product — campi tecnici e descrittivi */
  composition?: string | null
  features?: string | null
  formulation?: string | null
  product_type?: string | null
  application_areas?: string[]
  application_areas_text?: string | null
  dosage_and_application?: string | null
  usage?: string | null
  registration?: string | null
  target_pests?: string[]

  /** Downloadable / catalog */
  kind?: string | null
}

export interface SearchResultSection {
  type: SearchDocumentType
  label: string
  items: SearchDocument[]
}

export interface SearchResponse {
  query: string
  results: SearchResultSection[]
}
